"""Run script for the optimizations prototype (uses uvicorn).

Usage:
  python run_optimizations.py
"""
import uvicorn


if __name__ == "__main__":
    uvicorn.run("app.optimizations.api:app", host="127.0.0.1", port=8001, reload=False)
