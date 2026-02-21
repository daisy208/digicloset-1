from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import threading
import time
import uuid
import json
import os
from typing import Dict, Any

app = FastAPI(title="Digicloset Catalog Service")

STORE_PATH = os.path.join(os.path.dirname(__file__), "catalog_store.json")

def load_store():
    if not os.path.exists(STORE_PATH):
        return {"jobs": [], "items": []}
    with open(STORE_PATH, "r") as f:
        return json.load(f)

def save_store(store):
    with open(STORE_PATH, "w") as f:
        json.dump(store, f, default=str)


class BulkActionRequest(BaseModel):
    action: str  # optimize_all | seo | enhance_images | regen_descriptions
    shop_id: Optional[str] = None
    item_ids: Optional[List[str]] = None


class JobStatus(BaseModel):
    job_id: str
    action: str
    status: str
    progress: int
    total: int
    results: Optional[Dict[str, Any]] = None
    snapshots: Optional[Dict[str, Any]] = None


def apply_seo(item: Dict[str, Any]) -> Dict[str, Any]:
    # simple SEO improvement: append keywords and generate meta description
    original = item.get("description", "")
    meta = (original[:140] + "...") if len(original) > 140 else original
    item["seo_title"] = item.get("name", "") + " — Try it on"
    item["meta_description"] = meta
    return item


def enhance_image(item: Dict[str, Any]) -> Dict[str, Any]:
    # placeholder: simulate image enhancement by adding a suffix to image URL
    img = item.get("image", "")
    item["image_enhanced"] = img + "?enhanced=true"
    return item


def regen_description(item: Dict[str, Any]) -> Dict[str, Any]:
    # placeholder: regenerate description by adding AI tag
    orig = item.get("description", "")
    item["description"] = orig + "\nAI-enhanced description for clearer fit and material details."
    return item


def compute_quality_score(item: Dict[str, Any]) -> Dict[str, Any]:
    """Compute a simple quality score and opportunity indicator for an item.
    Score components (weights): image present (25), image_enhanced (10), description length (30), seo_title/meta (20), price present (5), has_tags (10).
    Returns dict with `score` (0-100), `opportunity` (True if score < 80), and `improvement_potential` (100 - score).
    """
    score = 0.0
    # image
    if item.get("image"):
        score += 25
    if item.get("image_enhanced"):
        score += 10
    # description length
    desc = (item.get("description") or "").strip()
    if len(desc) >= 200:
        score += 30
    elif len(desc) >= 100:
        score += 15
    else:
        score += 5
    # seo
    if item.get("seo_title"):
        score += 10
    if item.get("meta_description"):
        score += 10
    # price
    if item.get("price") is not None:
        score += 5
    # tags
    if item.get("tags") and len(item.get("tags")) > 0:
        score += 10

    # clamp
    score = max(0, min(100, score))
    opportunity = score < 80
    improvement_potential = round(100 - score, 1)
    # priority suggestion: higher potential -> higher priority
    priority = "low"
    if improvement_potential >= 50:
        priority = "high"
    elif improvement_potential >= 20:
        priority = "medium"

    return {
        "score": round(score, 1),
        "opportunity": opportunity,
        "improvement_potential": improvement_potential,
        "priority": priority,
    }


@app.get("/catalog/quality")
def catalog_quality_summary():
    store = load_store()
    items = store.get("items", [])
    results = []
    for it in items:
        q = compute_quality_score(it)
        results.append({"id": it.get("id"), "name": it.get("name"), **q})
    # sort by improvement potential desc
    results_sorted = sorted(results, key=lambda x: x["improvement_potential"], reverse=True)
    return {"summary": results_sorted}


@app.get("/catalog/item/{item_id}/quality")
def item_quality(item_id: str):
    store = load_store()
    items = store.get("items", [])
    item = next((it for it in items if it.get("id") == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return compute_quality_score(item)


def run_job(job: Dict[str, Any]):
    store = load_store()
    items = store.setdefault("items", [])
    job_id = job["job_id"]
    action = job["action"]
    target_ids = job.get("item_ids") or [i.get("id") for i in items]
    total = len(target_ids)
    job["status"] = "running"
    job["progress"] = 0
    job["total"] = total
    job["snapshots"] = {}
    save_store(store)

    for idx, item_id in enumerate(target_ids):
        # find item
        item = next((it for it in items if it.get("id") == item_id), None)
        if not item:
            continue
        # snapshot before change for undo
        job["snapshots"][item_id] = {"name": item.get("name"), "description": item.get("description"), "image": item.get("image"), "seo_title": item.get("seo_title"), "meta_description": item.get("meta_description"), "image_enhanced": item.get("image_enhanced")}

        # simulate work
        time.sleep(0.5)  # simulate processing time per item

        if action in ("optimize_all", "seo"):
            apply_seo(item)
        if action in ("optimize_all", "enhance_images"):
            enhance_image(item)
        if action in ("optimize_all", "regen_descriptions"):
            regen_description(item)

        # update progress
        job["progress"] = idx + 1
        save_store(store)

    job["status"] = "completed"
    job["results"] = {"processed": job["progress"]}
    save_store(store)


@app.post("/catalog/bulk_action")
def start_bulk_action(req: BulkActionRequest, background_tasks: BackgroundTasks):
    store = load_store()
    job_id = str(uuid.uuid4())
    job = {"job_id": job_id, "action": req.action, "status": "queued", "progress": 0, "total": 0, "item_ids": req.item_ids}
    store.setdefault("jobs", []).append(job)
    save_store(store)

    # start background thread
    t = threading.Thread(target=run_job, args=(job,))
    t.daemon = True
    t.start()

    return {"job_id": job_id}


@app.get("/catalog/job/{job_id}")
def get_job(job_id: str):
    store = load_store()
    job = next((j for j in store.get("jobs", []) if j.get("job_id") == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/catalog/jobs")
def list_jobs():
    store = load_store()
    return store.get("jobs", [])


@app.post("/catalog/job/{job_id}/undo")
def undo_job(job_id: str):
    store = load_store()
    job = next((j for j in store.get("jobs", []) if j.get("job_id") == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not job.get("snapshots"):
        raise HTTPException(status_code=400, detail="No snapshots available to undo")

    items = store.setdefault("items", [])
    for item_id, snap in job["snapshots"].items():
        item = next((it for it in items if it.get("id") == item_id), None)
        if not item:
            continue
        # restore fields
        for k, v in snap.items():
            item[k] = v

    job["status"] = "undone"
    save_store(store)
    return {"status": "ok"}


@app.post("/catalog/items/load_sample")
def load_sample_items():
    # create example items if none
    store = load_store()
    if store.get("items"):
        return {"count": len(store.get("items"))}
    sample = []
    for i in range(1, 21):
        sample.append({
            "id": f"demo-shop:sku-{i}",
            "name": f"Sample Item {i}",
            "description": f"A lovely item number {i} made of fine materials.",
            "image": f"/images/sample-{i}.jpg",
            "price": 29.99 + i,
        })
    store["items"] = sample
    save_store(store)
    return {"count": len(sample)}


def generate_description_variants(item: Dict[str, Any], n: int = 3) -> List[Dict[str, Any]]:
    base = item.get("description", "")
    variants = []
    # try to load merchant learning adjustments if available
    adjustments: Dict[str, float] = {}
    try:
        metrics_path = os.path.join(os.path.dirname(__file__), "metrics_store.json")
        if os.path.exists(metrics_path):
            with open(metrics_path, "r") as mf:
                mstore = json.load(mf)
                profiles = mstore.get("merchant_profiles", {})
                shop = (item.get("id") or "").split(":")[0]
                prof = profiles.get(shop, {})
                adjustments = prof.get("learning_adjustments") or {}
    except Exception:
        adjustments = {}

    for i in range(n):
        if i == 0:
            v = base + "\nFeatures: premium fabric, true-to-size fit." 
        elif i == 1:
            v = base + "\nHighlights: sustainable materials, effortless style." 
        else:
            v = base + "\nWhy customers love it: comfortable, versatile, easy care." 
        # apply simple adjustments: append highly-weighted tokens
        if adjustments:
            top_tokens = sorted(adjustments.items(), key=lambda x: x[1], reverse=True)[:3]
            if top_tokens:
                extra = " " + " ".join(t for t, _ in top_tokens)
                v = v + "\n" + extra
        variants.append({"variant_id": f"{item.get('id')}:desc:{i}", "description": v})
    return variants


def generate_title_variants(item: Dict[str, Any], n: int = 5) -> List[Dict[str, Any]]:
    name = item.get("name", "Product")
    variants = []
    endings = ["— Best Seller", "| New Arrival", "— Limited Edition", "| Comfortable Fit", "— Editor's Pick"]
    # load learning adjustments
    adjustments: Dict[str, float] = {}
    try:
        metrics_path = os.path.join(os.path.dirname(__file__), "metrics_store.json")
        if os.path.exists(metrics_path):
            with open(metrics_path, "r") as mf:
                mstore = json.load(mf)
                profiles = mstore.get("merchant_profiles", {})
                shop = (item.get("id") or "").split(":")[0]
                prof = profiles.get(shop, {})
                adjustments = prof.get("learning_adjustments") or {}
    except Exception:
        adjustments = {}

    for i in range(n):
        title = f"{name} {endings[i % len(endings)]}"
        # score heuristic: shorter titles get slight boost, 'Best Seller' gets boost
        score = 100 - len(title)
        if "Best Seller" in title:
            score += 10
        # bias by adjustments: if tokens present, bump score
        if adjustments:
            for t, w in adjustments.items():
                if t in title.lower():
                    score += float(w) * 2
        variants.append({"title": title, "score": round(score, 1)})
    # sort by score desc
    variants.sort(key=lambda x: x["score"], reverse=True)
    return variants


def suggest_upsell_bundles(shop_id: Optional[str], item_id: str, top_n: int = 3) -> List[Dict[str, Any]]:
    store = load_store()
    items = store.get("items", [])
    # pick top revenue products (simple) and exclude the source item
    revenue_map = {}
    for e in store.get("events", []):
        pid = e.get("product_id")
        if not pid:
            continue
        revenue_map[pid] = revenue_map.get(pid, 0) + float(e.get("revenue", 0) or 0)
    sorted_products = sorted(revenue_map.items(), key=lambda x: x[1], reverse=True)
    suggestions = []
    for pid, rev in sorted_products:
        if pid == item_id:
            continue
        # include only products for same shop if product ids are namespaced
        if shop_id and not str(pid).startswith(f"{shop_id}:"):
            continue
        suggestions.append({"product_id": pid, "estimated_incremental_revenue": rev * 0.05})
        if len(suggestions) >= top_n:
            break
    # fallback: random other items
    if len(suggestions) < top_n:
        for it in items:
            pid = it.get("id")
            if pid == item_id:
                continue
            if any(s.get("product_id") == pid for s in suggestions):
                continue
            suggestions.append({"product_id": pid, "estimated_incremental_revenue": 0})
            if len(suggestions) >= top_n:
                break
    return suggestions


def suggest_price_adjustment(item: Dict[str, Any]) -> Dict[str, Any]:
    # Basic heuristic: if price > avg of samples, suggest -5% to increase conversions; if price low, suggest +5% to increase margin
    try:
        price = float(item.get("price", 0) or 0)
    except Exception:
        price = 0.0
    store = load_store()
    prices = [float(it.get("price", 0) or 0) for it in store.get("items", []) if it.get("price")]
    avg_price = sum(prices) / len(prices) if prices else 0
    suggestion = {"current_price": price, "avg_price": round(avg_price, 2)}
    if price <= 0:
        suggestion.update({"action": "set_price", "suggested_price": round(avg_price or 9.99, 2), "rationale": "No price set; recommend baseline"})
    elif price > avg_price * 1.1:
        suggested = round(price * 0.95, 2)
        suggestion.update({"action": "discount", "suggested_price": suggested, "rationale": "Price above average — small discount may increase conversion"})
    elif price < avg_price * 0.9:
        suggested = round(price * 1.05, 2)
        suggestion.update({"action": "raise", "suggested_price": suggested, "rationale": "Price below average — small increase may improve margin"})
    else:
        suggestion.update({"action": "hold", "suggested_price": price, "rationale": "Price near average — hold"})
    return suggestion


@app.get("/catalog/item/{item_id}/suggestions")
def item_suggestions(item_id: str, shop_id: Optional[str] = None):
    store = load_store()
    items = store.get("items", [])
    item = next((it for it in items if it.get("id") == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    desc_variants = generate_description_variants(item)
    title_variants = generate_title_variants(item)
    upsells = suggest_upsell_bundles(shop_id, item_id)
    price = suggest_price_adjustment(item)

    return {"descriptions": desc_variants, "titles": title_variants, "upsells": upsells, "price_suggestion": price}


def estimate_item_impact(item_before: Dict[str, Any], item_after: Dict[str, Any]) -> Dict[str, Any]:
    # heuristic: improvement_potential maps to conversion lift; scale factor chosen for demo
    before = compute_quality_score(item_before)
    after = compute_quality_score(item_after)
    delta = max(0.0, after["improvement_potential"] - before["improvement_potential"]) if isinstance(after["improvement_potential"], (int, float)) else 0.0
    # conversion lift percent per item (demo): 0.15 * delta
    conversion_lift_pct = round(0.15 * delta, 3)
    # estimate baseline monthly revenue: assume baseline monthly sales (demo) = 20 units
    try:
        price = float(item_before.get("price", 0) or 0)
    except Exception:
        price = 0.0
    baseline_monthly_sales = item_before.get("estimated_monthly_sales", 20)
    baseline_revenue = price * baseline_monthly_sales
    estimated_revenue_lift = round(baseline_revenue * (conversion_lift_pct / 100.0), 2)
    # estimate time saved per item (demo): proportional to improvement_potential / 10 minutes
    time_saved_minutes = round((before.get("improvement_potential", 0) / 10.0), 1)
    return {"conversion_lift_pct": conversion_lift_pct, "estimated_revenue_lift": estimated_revenue_lift, "time_saved_minutes": time_saved_minutes, "before_score": before.get("score"), "after_score": after.get("score")}


@app.post("/catalog/optimize_and_deliver")
def optimize_and_deliver(req: BulkActionRequest):
    """Run requested optimizations synchronously (demo) and create a delivery record for the merchant with estimated lifts.
    Returns a summary including estimatedRevenueLift, conversionRateImpact, timeSavedMinutes, and a roiStatement."""
    store = load_store()
    items = store.setdefault("items", [])
    shop_id = req.shop_id
    target_ids = req.item_ids or [i.get("id") for i in items]
    processed = 0
    total_revenue_lift = 0.0
    total_time_saved = 0.0
    details = []

    for item_id in target_ids:
        item = next((it for it in items if it.get("id") == item_id), None)
        if not item:
            continue
        before_snapshot = dict(item)
        # apply requested transforms
        if req.action in ("optimize_all", "seo"):
            apply_seo(item)
        if req.action in ("optimize_all", "enhance_images"):
            enhance_image(item)
        if req.action in ("optimize_all", "regen_descriptions"):
            regen_description(item)

        after_snapshot = dict(item)
        impact = estimate_item_impact(before_snapshot, after_snapshot)
        total_revenue_lift += impact.get("estimated_revenue_lift", 0)
        total_time_saved += impact.get("time_saved_minutes", 0)
        details.append({"item_id": item_id, "impact": impact})
        processed += 1

    # store delivery record
    delivery = {
        "delivery_id": str(uuid.uuid4()),
        "shop_id": shop_id,
        "action": req.action,
        "processed": processed,
        "total_revenue_lift": round(total_revenue_lift, 2),
        "total_time_saved_minutes": round(total_time_saved, 1),
        "details": details,
        "timestamp": str(time.time())
    }
    store.setdefault("deliveries", []).append(delivery)
    save_store(store)

    # create merchant-facing ROI statement
    roi_statement = f"Estimated monthly revenue lift ${delivery['total_revenue_lift']:,} and ~{int(delivery['total_time_saved_minutes'])} minutes saved across {processed} products."

    summary = {
        "estimatedRevenueLift": delivery["total_revenue_lift"],
        "conversionRateImpact": round(sum(d.get("impact", {}).get("conversion_lift_pct", 0) for d in details), 3),
        "timeSavedMinutes": delivery["total_time_saved_minutes"],
        "monthlyAiSummary": {"productsProcessed": processed, "detailsCount": len(details)},
        "roiStatement": roi_statement,
        "delivery_id": delivery["delivery_id"],
        "details": details,
    }

    return summary


@app.get("/catalog/deliveries/{shop_id}")
def get_deliveries(shop_id: str):
    store = load_store()
    return [d for d in store.get("deliveries", []) if d.get("shop_id") == shop_id]
