def test_invalid_tenant_access(client):
    # endpoint that requires tenant headers
    res = client.get("/api/shopify/products")
    assert res.status_code == 401
