import asyncio
import time

from app.ai.services.ai_with_cb import AIServiceWithCircuitBreaker


class FlakyAI:
    def __init__(self):
        self.model_name = "flaky"
        self._calls = 0

    async def infer(self, prompt, max_tokens=128, timeout=5):
        self._calls += 1
        # Fail for the first two calls, succeed afterwards
        if self._calls <= 2:
            raise RuntimeError("simulated failure")
        await asyncio.sleep(0)  # yield
        return {"text": f"ok:{prompt}", "confidence": 0.9, "model": self.model_name}


def test_circuit_breaker_opens_and_recovers():
    base = FlakyAI()
    cb = AIServiceWithCircuitBreaker(base, failure_threshold=2, reset_timeout=1.0, timeout=0.5)

    # Run two failing calls; circuit should open afterwards
    loop = asyncio.new_event_loop()
    try:
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(cb.infer("p1"))
        except Exception:
            pass
        try:
            loop.run_until_complete(cb.infer("p2"))
        except Exception:
            pass

        assert cb._state == "OPEN"

        # While open, immediate fallback returned
        res = loop.run_until_complete(cb.infer("p3"))
        assert res["text"] == "[unavailable]"

        # Wait for reset window
        time.sleep(1.1)

        # Now underlying service succeeds; the HALF_OPEN call should pass and transition to CLOSED
        res2 = loop.run_until_complete(cb.infer("p4"))
        assert res2["text"].startswith("ok:")
        assert cb._state == "CLOSED"
    finally:
        loop.close()
