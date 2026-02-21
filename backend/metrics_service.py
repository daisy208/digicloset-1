from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import os
import hashlib
import math
from typing import Dict, Any

app = FastAPI(title="Digicloset Metrics Service")

STORE_PATH = os.path.join(os.path.dirname(__file__), "metrics_store.json")

def load_store():
    if not os.path.exists(STORE_PATH):
        return {"events": []}
    with open(STORE_PATH, "r") as f:
        return json.load(f)

def save_store(store):
    with open(STORE_PATH, "w") as f:
        json.dump(store, f, default=str)

class Event(BaseModel):
    timestamp: datetime
    type: str  # 'view' | 'tryon' | 'conversion' | 'revenue'
    revenue: Optional[float] = None
    time_saved_minutes: Optional[float] = None
    product_id: Optional[str] = None

class MonthlySummary(BaseModel):
    month: str
    impressions: Optional[int] = 0
    clicks: Optional[int] = 0
    conversions: Optional[int] = 0
    notes: Optional[str] = None


class MerchantProfile(BaseModel):
    shop_id: str
    brand_tone: Optional[str] = None
    target_audience: Optional[str] = None
    product_category_behaviors: Optional[dict] = None
    style_embeddings: Optional[List[List[float]]] = None
    store_style_embedding: Optional[List[float]] = None
    best_patterns: Optional[List[dict]] = None
    learning_adjustments: Optional[Dict[str, Any]] = None
    settings: Optional[Dict[str, Any]] = None


class RatingRecord(BaseModel):
    shop_id: str
    product_id: Optional[str]
    output_type: str  # 'description' | 'title' | 'image'
    rating: int  # 1-5
    notes: Optional[str] = None
    timestamp: Optional[datetime] = None


class EditRecord(BaseModel):
    shop_id: str
    product_id: Optional[str]
    field: str  # 'description' | 'title'
    original: str
    edited: str
    time_saved_minutes: Optional[float] = None
    timestamp: Optional[datetime] = None

@app.post("/metrics/record")
def record_event(event: Event):
    store = load_store()
    store.setdefault("events", []).append(event.dict())
    save_store(store)
    return {"status": "ok"}

@app.get("/metrics/summary")
def metrics_summary(product_id: Optional[str] = None):
    store = load_store()
    events = [e for e in store.get("events", []) if (product_id is None or e.get("product_id") == product_id)]

    views = sum(1 for e in events if e.get("type") == "view")
    tryons = sum(1 for e in events if e.get("type") == "tryon")
    conversions = sum(1 for e in events if e.get("type") == "conversion")
    revenue = sum(e.get("revenue", 0) or 0 for e in events)
    time_saved_total = sum(e.get("time_saved_minutes", 0) or 0 for e in events)

    # Simple heuristics for demo purposes
    estimated_revenue_lift = revenue * 0.2  # assume 20% attributable
    conversion_rate_impact = (tryons and (conversions / tryons * 100) or 0) - 0  # %
    avg_time_saved = (time_saved_total / tryons) if tryons else 0

    # build last 3 months summary from stored monthlySummaries if present
    monthly_summaries = store.get("monthly_summaries") or []

    roi_statement = f"Estimated incremental revenue: ${estimated_revenue_lift:.0f} — conversion uplift {conversion_rate_impact:.2f}%"

    return {
        "estimatedRevenueLift": round(estimated_revenue_lift, 2),
        "conversionRateImpact": round(conversion_rate_impact, 2),
        "timeSavedMinutes": round(avg_time_saved, 1),
        "monthlyAiSummary": monthly_summaries[-3:],
        "roiStatement": roi_statement,
        "raw": {"views": views, "tryons": tryons, "conversions": conversions, "revenue": revenue}
    }

@app.post("/metrics/monthly_summary")
def add_monthly_summary(summary: MonthlySummary):
    store = load_store()
    store.setdefault("monthly_summaries", []).append(summary.dict())
    save_store(store)
    return {"status": "ok"}


def simple_text_embedding(text: str, dim: int = 64) -> List[float]:
    """Deterministic lightweight embedding based on hashing tokens.
    This is a fast, dependency-free placeholder for a production embedding model.
    """
    if not text:
        return [0.0] * dim
    tokens = text.lower().split()
    vec = [0.0] * dim
    for i, t in enumerate(tokens):
        h = hashlib.md5(t.encode('utf-8')).digest()
        # convert first 8 bytes into an integer then into a float
        val = int.from_bytes(h[:8], 'little', signed=False)
        idx = val % dim
        vec[idx] += (val % 1000) / 1000.0
    # normalize
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / norm for x in vec]


@app.post("/merchant/{shop_id}/profile")
def upsert_merchant_profile(shop_id: str, profile: MerchantProfile):
    store = load_store()
    profiles = store.setdefault("merchant_profiles", {})
    profiles[shop_id] = profile.dict()
    save_store(store)
    return {"status": "ok", "profile": profiles[shop_id]}


@app.get("/merchant/{shop_id}/profile")
def get_merchant_profile(shop_id: str):
    store = load_store()
    profiles = store.get("merchant_profiles", {})
    p = profiles.get(shop_id)
    if not p:
        raise HTTPException(status_code=404, detail="Profile not found")
    return p


@app.post("/merchant/{shop_id}/compute_embeddings")
def compute_and_store_embeddings(shop_id: str, descriptions: List[str]):
    """Compute per-product embeddings and a store-wide style embedding (average).
    Stores results in the merchant profile under `style_embeddings` and `store_style_embedding`.
    """
    store = load_store()
    profiles = store.setdefault("merchant_profiles", {})
    profile = profiles.get(shop_id, {})
    embeddings = [simple_text_embedding(d) for d in descriptions]
    # store as lists
    profile["style_embeddings"] = embeddings
    # average embedding
    if embeddings:
        dim = len(embeddings[0])
        avg = [0.0] * dim
        for e in embeddings:
            for i in range(dim):
                avg[i] += e[i]
        avg = [x / len(embeddings) for x in avg]
        profile["store_style_embedding"] = avg
    profiles[shop_id] = profile
    save_store(store)
    return {"status": "ok", "count": len(embeddings)}


@app.post("/metrics/rate_output")
def rate_output(rec: RatingRecord):
    store = load_store()
    store.setdefault("ratings", []).append(rec.dict())
    # update merchant profile aggregate
    profiles = store.setdefault("merchant_profiles", {})
    profile = profiles.get(rec.shop_id, {})
    ratings = profile.get("ratings", {})
    key = rec.output_type
    stat = ratings.get(key, {"count": 0, "sum": 0})
    stat["count"] = stat.get("count", 0) + 1
    stat["sum"] = stat.get("sum", 0) + rec.rating
    stat["avg"] = stat["sum"] / stat["count"]
    ratings[key] = stat
    profile["ratings"] = ratings
    profiles[rec.shop_id] = profile
    save_store(store)
    return {"status": "ok", "ratings": ratings}


@app.post("/metrics/record_edit")
def record_edit(rec: EditRecord):
    store = load_store()
    entry = rec.dict()
    entry["timestamp"] = str(rec.timestamp or datetime.utcnow())
    store.setdefault("edits", []).append(entry)
    # reinforcement: update merchant profile learning_adjustments if enabled
    profiles = store.setdefault("merchant_profiles", {})
    profile = profiles.get(rec.shop_id, {})
    settings = profile.get("settings", {}) or {}
    improve = settings.get("improve_future_outputs", False)
    if improve:
        # simple token-diff heuristic: tokens in edited text but not in original get +1, removed tokens get -1
        orig_tokens = set((rec.original or "").lower().split())
        edited_tokens = set((rec.edited or "").lower().split())
        adds = edited_tokens - orig_tokens
        removes = orig_tokens - edited_tokens
        adjustments = profile.get("learning_adjustments", {}) or {}
        for t in adds:
            adjustments[t] = adjustments.get(t, 0) + 1
        for t in removes:
            adjustments[t] = adjustments.get(t, 0) - 0.5
        profile["learning_adjustments"] = adjustments
        profiles[rec.shop_id] = profile
        save_store(store)

    save_store(store)
    return {"status": "ok"}


@app.get("/merchant/{shop_id}/settings")
def get_merchant_settings(shop_id: str):
    store = load_store()
    profiles = store.get("merchant_profiles", {})
    profile = profiles.get(shop_id, {})
    settings = profile.get("settings", {"improve_future_outputs": False, "learning_adjustments": {}})
    return {"settings": settings, "learning_adjustments": profile.get("learning_adjustments", {})}


@app.post("/merchant/{shop_id}/settings")
def set_merchant_settings(shop_id: str, payload: dict):
    store = load_store()
    profiles = store.setdefault("merchant_profiles", {})
    profile = profiles.get(shop_id, {})
    settings = profile.get("settings", {}) or {}
    settings.update(payload)
    profile["settings"] = settings
    profiles[shop_id] = profile
    save_store(store)
    return {"status": "ok", "settings": settings}


@app.get("/merchant/{shop_id}/best_products")
def best_products(shop_id: str, top_n: int = 5):
    """Return top-performing products for a shop based on revenue in recorded events.
    Also generates simple 'best patterns' (most common token prefixes in product ids/titles).
    """
    store = load_store()
    events = [e for e in store.get("events", []) if e.get("product_id")]
    # filter by shop_id encoded in product_id as 'shopid:productid' if present
    shop_events = [e for e in events if (str(e.get("product_id") or "")).startswith(f"{shop_id}:")]
    revenue_by_product = {}
    for e in shop_events:
        pid = e.get("product_id")
        revenue_by_product.setdefault(pid, 0.0)
        revenue_by_product[pid] += float(e.get("revenue", 0) or 0)

    sorted_products = sorted(revenue_by_product.items(), key=lambda x: x[1], reverse=True)[:top_n]

    # simple pattern detection: token frequency in product ids
    token_counts = {}
    for pid in revenue_by_product.keys():
        parts = pid.split(":")[-1].split("-")
        for p in parts:
            token_counts[p] = token_counts.get(p, 0) + 1
    common_tokens = sorted(token_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    patterns = [{"token": t, "count": c} for t, c in common_tokens]

    # persist patterns into merchant profile
    profiles = store.setdefault("merchant_profiles", {})
    profile = profiles.get(shop_id, {})
    profile["best_patterns"] = patterns
    profiles[shop_id] = profile
    save_store(store)

    return {"topProducts": [{"product_id": p, "revenue": r} for p, r in sorted_products], "patterns": patterns}


@app.get("/benchmarks/description_styles")
def benchmark_description_styles(niche: Optional[str] = None, top_n: int = 5, recent_days: int = 90):
    """Anonymous cross-store benchmarking for description styles.
    Scans recorded edits and ratings across all shops and reports top-performing tokens/phrases.
    """
    store = load_store()
    ratings = store.get("ratings", [])
    edits = store.get("edits", [])
    # collect scored tokens from ratings and edits within recent_days
    cutoff = datetime.utcnow().timestamp() - recent_days * 24 * 3600
    token_scores = {}
    token_counts = {}

    def tokenize(text: str):
        if not text:
            return []
        toks = [t.strip('.,!?:;').lower() for t in text.split() if len(t) > 2]
        return toks

    # use ratings to associate tokens with quality
    for r in ratings:
        try:
            ts = datetime.fromisoformat(r.get("timestamp")).timestamp() if r.get("timestamp") else datetime.utcnow().timestamp()
        except Exception:
            ts = datetime.utcnow().timestamp()
        if ts < cutoff:
            continue
        # if niche filter is provided, skip entries that don't match known niche tokens (best-effort)
        product_id = r.get("product_id") or ""
        if niche and niche.lower() not in product_id.lower() and niche.lower() not in (r.get("notes") or "").lower():
            # still include — this is demo, do not strictly filter
            pass
        # gather tokens from notes
        tokens = tokenize(r.get("notes") or "")
        if not tokens:
            continue
        for t in tokens:
            token_scores[t] = token_scores.get(t, 0.0) + (r.get("rating", 0) or 0)
            token_counts[t] = token_counts.get(t, 0) + 1

    # include edits (assume edited text contains good tokens merchants preferred)
    for e in edits:
        try:
            ts = datetime.fromisoformat(e.get("timestamp")).timestamp() if e.get("timestamp") else datetime.utcnow().timestamp()
        except Exception:
            ts = datetime.utcnow().timestamp()
        if ts < cutoff:
            continue
        edited = e.get("edited") or ""
        tokens = tokenize(edited)
        for t in tokens:
            token_scores[t] = token_scores.get(t, 0.0) + 3.0  # small boost
            token_counts[t] = token_counts.get(t, 0) + 1

    # compute average score per token
    token_avg = []
    for t, s in token_scores.items():
        cnt = max(1, token_counts.get(t, 1))
        token_avg.append((t, s / cnt, cnt))

    token_avg.sort(key=lambda x: x[1], reverse=True)
    results = [{"token": t, "avg_score": round(avg, 2), "count": cnt} for t, avg, cnt in token_avg[:top_n]]
    return {"niche": niche or "all", "top_styles": results}


@app.get("/benchmarks/industry_trends")
def industry_trends(niche: Optional[str] = None, period_days: int = 90):
    """Return simple trend signals across stores: rising tokens and high-level conversion stats.
    This endpoint purposely anonymizes shop ids and returns aggregated stats.
    """
    store = load_store()
    events = store.get("events", [])
    edits = store.get("edits", [])
    now = datetime.utcnow().timestamp()
    cutoff = now - period_days * 24 * 3600

    # conversions and tryons per shop anonymized
    conv_total = 0
    tryon_total = 0
    revenue_total = 0.0
    for e in events:
        try:
            ts = datetime.fromisoformat(e.get("timestamp")).timestamp() if e.get("timestamp") else now
        except Exception:
            ts = now
        if ts < cutoff:
            continue
        t = e.get("type")
        if t == "conversion":
            conv_total += 1
        if t == "tryon":
            tryon_total += 1
        revenue_total += float(e.get("revenue", 0) or 0)

    # rising tokens: compare last third vs first two-thirds
    def collect_token_freq(entries):
        freq = {}
        for ent in entries:
            txt = (ent.get("edited") or ent.get("notes") or "")
            toks = [t.strip('.,!?:;').lower() for t in txt.split() if len(t) > 3]
            for tk in toks:
                freq[tk] = freq.get(tk, 0) + 1
        return freq

    # split edits into early and recent
    edits_recent = []
    edits_early = []
    if edits:
        # sort by timestamp
        def ts_of(x):
            try:
                return datetime.fromisoformat(x.get("timestamp")).timestamp()
            except Exception:
                return 0
        edits_sorted = sorted(edits, key=ts_of)
        split = max(1, int(len(edits_sorted) * 2 / 3))
        edits_early = edits_sorted[:split]
        edits_recent = edits_sorted[split:]

    freq_early = collect_token_freq(edits_early)
    freq_recent = collect_token_freq(edits_recent)
    rising = []
    for tk, cnt in freq_recent.items():
        prev = freq_early.get(tk, 0)
        delta = cnt - prev
        if delta > 0:
            rising.append((tk, delta, cnt))
    rising.sort(key=lambda x: x[1], reverse=True)
    top_rising = [{"token": t, "increase": inc, "recent_count": c} for t, inc, c in rising[:20]]

    # anonymized conversion rate estimate
    conv_rate = (conv_total / tryon_total * 100) if tryon_total else 0.0

    return {"niche": niche or "fashion", "period_days": period_days, "conversions": conv_total, "tryons": tryon_total, "revenue": round(revenue_total,2), "conversion_rate_pct": round(conv_rate,2), "rising_tokens": top_rising}

