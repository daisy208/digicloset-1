"""Worker entrypoint for processing AI jobs with RQ.

Startup example:
    REDIS_URL=redis://redis:6379/0 python worker.py

Or use RQ CLI directly:
    rq worker ai --url $REDIS_URL

This module provides a programmatic worker for simple deployments.
"""
import logging
import os
from rq import Worker, Queue, Connection
from jobs.redis_conn import get_redis_connection

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_worker(queue_names=("ai",)) -> None:
    redis_conn = get_redis_connection()
    with Connection(redis_conn):
        qs = [Queue(name) for name in queue_names]
        worker = Worker(qs)
        logger.info("Starting RQ worker for queues=%s", queue_names)
        worker.work(with_scheduler=False)


if __name__ == "__main__":
    qnames = os.getenv("RQ_QUEUES", "ai").split(",")
    run_worker(tuple(qnames))
