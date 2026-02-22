"""Shopify adapter stubs for prototype.

Replace with real Shopify API integration in production.
"""
from typing import List, Dict


def list_store_products(store_id: str) -> List[Dict]:
    # prototype returns synthetic products
    return [{"id": f"p-{i}", "title": f"Product {i}"} for i in range(1, 6)]


def trigger_flow(payload: Dict) -> Dict:
    # accept payload and pretend we've queued a Shopify Flow action
    return {"status": "flow-triggered", "payload": payload}
