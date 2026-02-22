"""FastAPI HTTP API exposing optimization endpoints (prototype).

Run with `python run_optimizations.py` from repository root.
"""
from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Dict, Any
from .manager import OptimizationManager
from .storage import JSONStore
from .rbac import require_role, get_user_from_api_key
import json
import os

app = FastAPI(title="Optimizations Prototype")

store = JSONStore()
manager = OptimizationManager(datastore=store)


class OptimizeRequest(BaseModel):
    product_id: str
    options: Dict[str, Any] = {}


@app.post("/api/optimize/product")
def optimize_product(req: OptimizeRequest):
    rec = manager.optimize_product(req.product_id, req.options)
    return {"status": "ok", "record": rec.__dict__}


class CatalogRequest(BaseModel):
    store_id: str
    dry_run: bool = True


@app.post("/api/optimize/catalog")
def optimize_catalog(req: CatalogRequest):
    res = manager.one_click_full_catalog_optimize(req.store_id, dry_run=req.dry_run)
    return res


class RevertRequest(BaseModel):
    snapshot_id: str


@app.post("/api/optimize/revert")
def revert(req: RevertRequest):
    ok = manager.revert_optimization(req.snapshot_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    return {"status": "reverted", "snapshot_id": req.snapshot_id}


class ABTestRequest(BaseModel):
    product_id: str
    variant_a: Dict[str, str]
    variant_b: Dict[str, str]


@app.post("/api/abtest")
def create_abtest(req: ABTestRequest):
    t = manager.create_ab_test(req.product_id, req.variant_a, req.variant_b)
    return {"status": "created", "test": t.__dict__}


class FeedbackRequest(BaseModel):
    product_id: str
    feedback: Dict[str, Any]


@app.post("/api/feedback")
def feedback(req: FeedbackRequest):
    manager.record_ai_feedback(req.product_id, req.feedback)
    return {"status": "recorded"}


@app.get("/api/score/store/{store_id}/growth")
def store_growth(store_id: str):
    score = manager.compute_store_growth_score(store_id)
    return {"store_id": store_id, "growth_score": score}


@app.get("/api/score/product/{product_id}/seo")
def product_seo(product_id: str):
    score = manager.seo_health_score(product_id)
    return {"product_id": product_id, "seo_health": score}


# --- Admin endpoints (require admin role)
class ToggleFlagRequest(BaseModel):
    flag: str
    enabled: bool


@app.post("/api/admin/feature_flags/toggle")
def toggle_flag(req: ToggleFlagRequest, user=Depends(require_role("admin"))):
    # load and update feature_flags.json in config
    cfg_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config", "feature_flags.json")
    # support local running where config path is repo root
    if not os.path.exists(cfg_path):
        cfg_path = os.path.join(os.getcwd(), "config", "feature_flags.json")
    try:
        with open(cfg_path, "r+") as f:
            data = json.load(f)
            data[req.flag] = bool(req.enabled)
            f.seek(0)
            json.dump(data, f, indent=2)
            f.truncate()
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="feature_flags.json not found")
    return {"status": "ok", "flag": req.flag, "enabled": req.enabled}


@app.get("/api/admin/ai_credits")
def ai_credits(user=Depends(require_role("admin"))):
    summary = manager.datastore.summarize_ai_credits()
    return {"ai_credits_summary": summary}


@app.post("/api/admin/users/create")
def create_user(user_payload: Dict[str, Any], user=Depends(require_role("admin"))):
    # payload must include api_key and roles
    api_key = user_payload.get("api_key")
    roles = user_payload.get("roles", [])
    stores = user_payload.get("stores", [])
    if not api_key:
        raise HTTPException(status_code=400, detail="api_key required")
    manager.datastore.save_user({"api_key": api_key, "roles": roles, "stores": stores})
    return {"status": "created", "api_key": api_key}

