from fastapi.testclient import TestClient
from inference-service.main import app

client = TestClient(app)

def test_inference_health():
    res = client.get('/health')
    assert res.status_code == 200