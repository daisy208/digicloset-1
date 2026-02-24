def test_invalid_webhook_hmac(client):
    res = client.post("/api/webhooks/app-uninstalled", data=b"{}", headers={"X-Shopify-Hmac-Sha256": "bad"})
    assert res.status_code == 400
    assert res.json().get("detail") == "Invalid webhook signature"
