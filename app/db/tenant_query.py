from __future__ import annotations

from typing import Any

# Example DB helper to enforce tenant scoping on queries.
# Adapt this pattern to your ORM (SQLAlchemy, Tortoise, etc.).


def apply_shop_scope(query: Any, shop_id: int) -> Any:
    """Apply shop_id filter to a query. Ensures all DB reads/writes are scoped.

    Usage (SQLAlchemy example):
        q = session.query(Product)
        q = apply_shop_scope(q, tenant.shop_id)
    """
    # This is a placeholder. Implement per-ORM safe filtering.
    if hasattr(query, "filter"):
        return query.filter_by(shop_id=shop_id)
    return query
