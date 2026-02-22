# Optimizations prototype

This folder contains a lightweight prototype scaffold implementing the requested feature set at a high level.

Quick start:

1. Install requirements:

```bash
pip install -r requirements.txt
```

2. Run the API:

```bash
python run_optimizations.py
```

3. Example: optimize a product

```bash
curl -X POST "http://127.0.0.1:8001/api/optimize/product" -H "Content-Type: application/json" -d '{"product_id":"p-1"}'
```

Notes:
- This is a prototype. Replace adapters with production integrations and swap `JSONStore` for a proper DB.
- Feature flags are available at `config/feature_flags.json`.
