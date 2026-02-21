from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import os

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
