import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure project root is on path so `import app` works
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.main import app


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
