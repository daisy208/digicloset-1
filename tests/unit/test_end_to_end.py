import os
import requests
from dotenv import load_dotenv
load_dotenv()

API_BASE = os.getenv('VITE_API_BASE_URL') or os.getenv('API_BASE_URL') or 'http://localhost:8000'

def test_health():
    r = requests.get(f"{API_BASE}/health")
    assert r.status_code == 200

def test_tryon_flow():
    # simplified flow: upload image -> start job -> poll result
    # This test expects the API to support these endpoints - adapt paths as needed.
    files = {'file': ('sample.jpg', b'binarydata', 'image/jpeg')}
    r = requests.post(f"{API_BASE}/v1/tryon/upload", files=files)
    assert r.status_code in (200,201,202)
    data = r.json()
    job_id = data.get('job_id') or data.get('id')
    assert job_id is not None
    # Poll job (example)
    r2 = requests.get(f"{API_BASE}/v1/tryon/status/{job_id}")
    assert r2.status_code == 200
