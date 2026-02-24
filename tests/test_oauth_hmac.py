import pytest

from fastapi.testclient import TestClient


def test_invalid_oauth_hmac(client: TestClient):
    # Call callback with bad hmac
    params = {
        "shop": "example.myshopify.com",
        "code": "abc",
        "state": "s1",
        "hmac": "invalid",
    }
    res = client.get("/api/auth/callback", params=params)
    assert res.status_code == 400
    assert res.json().get("detail") in ("Invalid HMAC", "Missing HMAC")
