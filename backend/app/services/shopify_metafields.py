import requests

def write_metafields(
    shop: str,
    access_token: str,
    product_id: str,
    payload: dict
):
    url = f"https://{shop}/admin/api/2024-01/products/{product_id}/metafields.json"

    headers = {
        "X-Shopify-Access-Token": access_token,
        "Content-Type": "application/json"
    }

    metafields = []
    for key, value in payload.items():
        metafields.append({
            "namespace": "digicloset_ai",
            "key": key,
            "type": "json",
            "value": value
        })

    response = requests.post(
        url,
        headers=headers,
        json={"metafields": metafields}
    )

    response.raise_for_status()
