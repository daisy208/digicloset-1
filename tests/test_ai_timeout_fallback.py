import asyncio


def test_ai_timeout_fallback(client, monkeypatch):
    from app.main import app as fastapi_app

    class SlowAI:
        async def infer(self, prompt, max_tokens=None):
            await asyncio.sleep(2)
            return {"text": "ok", "confidence": 0.9}

    # set a very small timeout for this test
    from app.core.config import settings
    old = settings.ai_inference_timeout
    settings.ai_inference_timeout = 0.01
    fastapi_app.state.ai_service = SlowAI()

    res = client.post("/api/ai/infer", json={"prompt": "hello", "max_tokens": 5})
    assert res.status_code == 200
    data = res.json()
    assert data["text"] == "The AI service timed out. Please try again later."

    # restore
    settings.ai_inference_timeout = old
