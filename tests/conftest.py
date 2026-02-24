import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure project root is on path so `import app` works
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.main import app


class DummyRedis:
    def __init__(self):
        self._d = {}

    def setex(self, key, ttl, val):
        self._d[key] = val

    def get(self, key):
        return self._d.get(key)

    def setnx(self, key, val):
        if key in self._d:
            return False
        self._d[key] = val
        return True

    def expire(self, key, ttl):
        return True

    def ping(self):
        return True

    def close(self):
        return None


@pytest.fixture(autouse=True)
def inject_redis():
    app.state.redis = DummyRedis()
    yield


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def mock_ai_service(monkeypatch):
    class MockAIService:
        async def infer(self, prompt, max_tokens=128, timeout=10.0):
            return {"text": f"echo: {prompt}", "confidence": 0.99, "model": "mock-model"}

    # Attach to app state for tests
    app.state.ai_service = MockAIService()
    return app.state.ai_service


@pytest.fixture
def tenant_headers_a():
    return {"x-shopify-shop-domain": "a.myshopify.com", "authorization": "Bearer tokA"}


@pytest.fixture
def tenant_headers_b():
    return {"x-shopify-shop-domain": "b.myshopify.com", "authorization": "Bearer tokB"}
