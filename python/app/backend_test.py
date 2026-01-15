# tests/backend_test.py
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_healthcheck():
    response = client.get("/health")
    assert response.status_code == 200