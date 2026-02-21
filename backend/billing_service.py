from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json
from datetime import datetime

app = FastAPI(title="Digicloset Billing Service")

STORE_PATH = os.path.join(os.path.dirname(__file__), "billing_store.json")

def load_store():
    if not os.path.exists(STORE_PATH):
        return {"accounts": {}, "usage": []}
    with open(STORE_PATH, "r") as f:
        return json.load(f)

def save_store(store):
    with open(STORE_PATH, "w") as f:
        json.dump(store, f, default=str)


class UsageRecord(BaseModel):
    shop_id: Optional[str]
    type: str  # 'ai_credit' | 'subscription' | 'one_time'
    amount: float
    description: Optional[str] = None
    feature: Optional[str] = None
    time_saved_minutes: Optional[float] = None
    timestamp: Optional[datetime] = None


class ChargeRequest(BaseModel):
    shop_id: str
    amount: float
    description: Optional[str] = None


@app.get("/billing/credits")
def get_credits(shop_id: Optional[str] = None):
    store = load_store()
    accounts = store.get("accounts", {})
    if shop_id:
        acc = accounts.get(shop_id, {"credits": 1000.0, "plan": {"name":"free","limits":{}}, "hourly_rate":50.0})
        return {"shop_id": shop_id, "credits": acc.get("credits", 0), "plan": acc.get("plan"), "hourly_rate": acc.get("hourly_rate", 50.0)}
    # return all
    return accounts


@app.post("/billing/charge")
def charge_account(req: ChargeRequest):
    store = load_store()
    accounts = store.setdefault("accounts", {})
    acc = accounts.setdefault(req.shop_id, {"credits": 1000.0, "charges": []})
    if acc.get("credits", 0) < req.amount:
        raise HTTPException(status_code=402, detail="Insufficient credits")
    acc["credits"] = acc.get("credits", 0) - req.amount
    entry = {"amount": req.amount, "description": req.description, "timestamp": str(datetime.utcnow())}
    acc.setdefault("charges", []).append(entry)
    store.setdefault("usage", []).append({"shop_id": req.shop_id, "type": "ai_credit_charge", "amount": req.amount, "description": req.description, "timestamp": str(datetime.utcnow())})
    save_store(store)
    return {"status": "ok", "credits": acc["credits"]}


@app.post("/billing/usage")
def record_usage(rec: UsageRecord):
    store = load_store()
    timestamp = rec.timestamp or datetime.utcnow()
    entry = {"shop_id": rec.shop_id, "type": rec.type, "amount": rec.amount, "description": rec.description, "feature": rec.feature, "time_saved_minutes": rec.time_saved_minutes, "timestamp": str(timestamp)}
    store.setdefault("usage", []).append(entry)
    save_store(store)
    # enforce plan-level limits per feature (monthly)
    if rec.shop_id and rec.type == "ai_credit":
        accounts = store.setdefault("accounts", {})
        acc = accounts.setdefault(rec.shop_id, {"credits": 1000.0, "charges": [], "plan": {"name":"free","limits":{}}, "hourly_rate":50.0})
        # calculate current month usage for this feature
        feature = rec.feature
        if feature:
            now = timestamp
            month_start = datetime(now.year, now.month, 1)
            usage = [u for u in store.get("usage", []) if u.get("shop_id") == rec.shop_id and u.get("feature") == feature]
            monthly_total = 0.0
            for u in usage:
                try:
                    t = datetime.fromisoformat(u.get("timestamp"))
                except Exception:
                    continue
                if t >= month_start:
                    monthly_total += float(u.get("amount", 0))
            limit = acc.get("plan", {}).get("limits", {}).get(feature)
            if limit is not None and monthly_total > limit:
                raise HTTPException(status_code=402, detail=f"Feature limit exceeded for {feature}")
        # deduct credits
        acc["credits"] = acc.get("credits", 0) - rec.amount
        save_store(store)
    return {"status": "ok"}


@app.get("/billing/usage")
def get_usage(shop_id: Optional[str] = None, limit: int = 100):
    store = load_store()
    usage = store.get("usage", [])
    if shop_id:
        usage = [u for u in usage if u.get("shop_id") == shop_id]
    return {"usage": usage[-limit:][::-1]}


@app.get("/billing/usage_per_feature")
def get_usage_per_feature(shop_id: Optional[str] = None):
    store = load_store()
    usage = store.get("usage", [])
    if shop_id:
        usage = [u for u in usage if u.get("shop_id") == shop_id]
    per_feature: Dict[str, Dict[str, float]] = {}
    for u in usage:
        f = u.get("feature") or "unknown"
        rec = per_feature.setdefault(f, {"count": 0, "credits": 0.0, "time_saved_minutes": 0.0})
        rec["count"] += 1
        rec["credits"] += float(u.get("amount", 0))
        rec["time_saved_minutes"] += float(u.get("time_saved_minutes", 0) or 0)
    return {"per_feature": per_feature}


@app.get("/billing/savings_estimate")
def get_savings_estimate(shop_id: Optional[str] = None):
    store = load_store()
    accounts = store.get("accounts", {})
    acc = accounts.get(shop_id, {}) if shop_id else {}
    hourly_rate = acc.get("hourly_rate", 50.0)
    usage = [u for u in store.get("usage", []) if (not shop_id) or u.get("shop_id") == shop_id]
    total_minutes = sum(float(u.get("time_saved_minutes", 0) or 0) for u in usage)
    estimated_savings = (total_minutes / 60.0) * hourly_rate
    per_feature = {}
    for u in usage:
        f = u.get("feature") or "unknown"
        pf = per_feature.setdefault(f, {"time_saved_minutes": 0.0, "credits_spent": 0.0})
        pf["time_saved_minutes"] += float(u.get("time_saved_minutes", 0) or 0)
        pf["credits_spent"] += float(u.get("amount", 0) or 0)
    return {"estimated_savings": estimated_savings, "hourly_rate": hourly_rate, "per_feature": per_feature}
