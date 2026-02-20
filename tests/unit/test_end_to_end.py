import os
import requests
import pytest
from dotenv import load_dotenv

load_dotenv()

API_BASE = os.getenv('VITE_API_BASE_URL') or os.getenv('API_BASE_URL') or 'http://localhost:8000'

def _server_available() -> bool:
    for path in ("/health", "/"):
        try:
            r = requests.get(f"{API_BASE}{path}", timeout=2)
            if r.status_code < 500:
                return True
        except requests.RequestException:
            continue
    return False


@pytest.mark.skipif(not _server_available(), reason="Integration API not running")
def test_health():
    # Prefer /health when available; fallback to root for legacy services.
    try:
        r = requests.get(f"{API_BASE}/health", timeout=5)
        if r.status_code == 404:
            r = requests.get(f"{API_BASE}/", timeout=5)
    except requests.RequestException as exc:
        pytest.skip(f"API unavailable: {exc}")
    assert r.status_code == 200


@pytest.mark.skipif(not _server_available(), reason="Integration API not running")
def test_tryon_flow(tmp_path):
    # 1. Upload Image
    sample = tmp_path / "sample.jpg"
    sample.write_bytes(b"\xFF\xD8\xFF\xE0\x00\x10\x4A\x46\x49\x46\x00\x01")

    with sample.open("rb") as fh:
        files = {'file': ('sample.jpg', fh, 'image/jpeg')}
        r_upload = requests.post(f"{API_BASE}/api/v1/uploads/", files=files, timeout=15)
    print(f"Upload response: {r_upload.status_code} {r_upload.text}")
    assert r_upload.status_code == 200
    upload_data = r_upload.json()
    upload_id = upload_data.get('id')
    assert upload_id is not None
    print(f"Upload ID: {upload_id}")

    # 2. Submit Inference Job
    print("Step 2: Submitting inference job...")
    payload = {"upload_id": upload_id, "garment_id": "test_garment"}
    r_infer = requests.post(f"{API_BASE}/api/v1/infer/", json=payload, timeout=15)
    print(f"Infer response: {r_infer.status_code} {r_infer.text}")
    assert r_infer.status_code == 200
    infer_data = r_infer.json()
    job_id = infer_data.get('job_id')
    assert job_id is not None
    print(f"Job ID: {job_id}")

    # 3. Poll Job Status
    print("Step 3: Polling job status...")
    r_status = requests.get(f"{API_BASE}/api/v1/infer/{job_id}", timeout=15)
    print(f"Status response: {r_status.status_code} {r_status.text}")
    assert r_status.status_code == 200
    status_data = r_status.json()
    assert status_data.get('status') in ['queued', 'processing', 'completed', 'success']
    print("Job is queued as expected.")

if __name__ == "__main__":
    try:
        print(f"Running tests against {API_BASE}...")
        
        test_health()
        print("Health check passed!")
        
        try:
            from pathlib import Path
            test_tryon_flow(Path("."))
            print("Try-on flow passed!")
        except Exception as e:
            print(f"Try-on flow failed: {e}")
            raise e

        print("All tests passed!")
    except Exception as e:
        print(f"CRITICAL FAILURE: {e}")
        exit(1)
