import requests

def write_metafields(shop, token, product_id, data):
    url = f"https://{shop}/admin/api/2024-01/products/{product_id}/metafields.json"
    headers = {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json"
    }
    metafields = [
        {
            "namespace": "digicloset_ai",
            "key": k,
            "type": "json",
            "value": v
        } for k, v in data.items()
    ]
    r = requests.post(url, headers=headers, json={"metafields": metafields})
    r.raise_for_status()
