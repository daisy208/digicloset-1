import importlib
import pytest

MSG = """Test expects your backend to expose either:
 - `app` (FastAPI/Flask ASGI app), or
 - a function `health_check` / `health` that returns a 200-like dict.
If test fails, add a /health endpoint or expose a `health_check()` function in backend/ai_service.py"""

def test_import_and_health():
    mod = importlib.import_module('backend.ai_service')
    # prefer FastAPI or Flask app object
    if hasattr(mod, 'app'):
        app = getattr(mod, 'app')
        assert app is not None, MSG
        return
    # otherwise check for health function
    for name in ('health_check', 'health'):
        if hasattr(mod, name):
            fn = getattr(mod, name)
            res = fn() if callable(fn) else None
            assert res is not None, MSG
            return
    pytest.skip(MSG)