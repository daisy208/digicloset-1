import fakeredis
from jobs import redis_conn
from rq import Queue
from rq.job import Job


def test_enqueue_and_process(monkeypatch):
    """Integration-style test that mocks Redis with fakeredis and processes a job."""
    fake = fakeredis.FakeRedis()

    # Patch our redis connector to return the fake redis instance
    monkeypatch.setattr(redis_conn, "get_redis_connection", lambda **kw: fake)

    # Patch the worker AI service to avoid importing heavy model libraries
    class MockAI:
        def __init__(self):
            self.model_name = "mock"

        async def infer(self, prompt, max_tokens=128, timeout=30):
            return {"text": f"echo:{prompt}", "confidence": 0.5, "model": self.model_name}

    monkeypatch.setattr("jobs.ai_tasks.get_ai_service", lambda: MockAI())

    q = Queue("ai", connection=fake)
    job = q.enqueue("jobs.ai_tasks.process_inference", "test prompt", 8, job_timeout=30)

    # Use SimpleWorker to process job synchronously (burst mode)
    from rq.worker import SimpleWorker

    w = SimpleWorker([q], connection=fake)
    w.work(burst=True)

    fetched = Job.fetch(job.id, connection=fake)
    assert fetched.is_finished
    assert isinstance(fetched.result, dict)
    assert "text" in fetched.result
