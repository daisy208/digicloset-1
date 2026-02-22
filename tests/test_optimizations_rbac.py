import os
import tempfile
import json

from fastapi.testclient import TestClient

from app.optimizations.api import app, manager


def setup_admin_user(api_key: str = "adminkey-1"):
    # ensure datastore uses repo-local data dir
    manager.datastore.save_user({"api_key": api_key, "roles": ["admin"], "stores": ["store-1"]})
    return api_key


def test_admin_toggle_flag_and_ai_credits():
    client = TestClient(app)
    key = setup_admin_user()

    # toggle a flag
    resp = client.post("/api/admin/feature_flags/toggle", json={"flag": "ai_impact_tagging", "enabled": True}, headers={"X-API-KEY": key})
    assert resp.status_code == 200
    assert resp.json().get("enabled") is True

    # log some credits and fetch summary
    manager.datastore.log_ai_credit_usage("store-1", 10.5, "test")
    resp = client.get("/api/admin/ai_credits", headers={"X-API-KEY": key})
    assert resp.status_code == 200
    data = resp.json().get("ai_credits_summary")
    assert data.get("store-1") >= 10.5
