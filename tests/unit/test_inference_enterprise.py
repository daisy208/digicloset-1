from fastapi.testclient import TestClient
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from inference_service.main import app

client = TestClient(app)

def test_inference_health():
    res = client.get('/health')
    assert res.status_code == 200
