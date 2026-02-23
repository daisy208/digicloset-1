from app.ai.schemas import AIRequest


def test_ai_infer_endpoint(client, mock_ai_service):
    payload = {"prompt": "hello world", "max_tokens": 32}
    resp = client.post("/api/ai/infer", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["text"].startswith("echo: hello world")
    assert body["confidence"] == 0.99
    assert body["model"] == "mock-model"
