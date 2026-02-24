"""Lightweight smoke test for `jobs.ai_tasks.process_inference` without external deps.

This runs the job function directly with a stubbed AI service so it can be executed
inside restricted containers without installing `rq` or `fakeredis`.
"""
from jobs import ai_tasks


class MockAI:
    def __init__(self):
        self.model_name = "mock"

    async def infer(self, prompt, max_tokens=128, timeout=30):
        return {"text": f"echo:{prompt}", "confidence": 0.5, "model": self.model_name}


def main():
    # Monkeypatch the ai service provider used by the worker
    ai_tasks.get_ai_service = lambda: MockAI()

    # Run the job function directly (synchronous call)
    result = ai_tasks.process_inference("smoke prompt", max_tokens=16)
    print("JOB RESULT:", result)


if __name__ == "__main__":
    main()
