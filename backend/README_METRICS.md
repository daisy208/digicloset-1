# Digicloset Metrics & Merchant Profile Service

This lightweight FastAPI service provides:

- Event recording (`POST /metrics/record`)
- Metrics summary (`GET /metrics/summary`)
- Monthly AI summaries (`POST /metrics/monthly_summary`)
- Merchant profile CRUD and analytics:
  - `POST /merchant/{shop_id}/profile` - upsert profile
  - `GET /merchant/{shop_id}/profile` - fetch profile
  - `POST /merchant/{shop_id}/compute_embeddings` - compute per-product embeddings and store-wide style embedding
  - `GET /merchant/{shop_id}/best_products` - return top products and detected patterns

Persistence is file-based in `metrics_store.json` (created in the `backend` folder).

Run locally:

```bash
pip install fastapi uvicorn
uvicorn backend.metrics_service:app --reload --port 8000
```

Notes:
- Embeddings use a deterministic, dependency-free hash-based function as a placeholder. Replace with a production embedding model (e.g., OpenAI embeddings or sentence-transformers) for better results.
- `product_id` in events may be scoped by shop as `shopid:productid` to allow per-shop aggregation.
