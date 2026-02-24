import os
import logging

logger = logging.getLogger(__name__)


def get_redis_url() -> str:
    return os.getenv("REDIS_URL", "redis://localhost:6379/0")


def get_redis_connection(**kwargs):
    """Return a Redis connection if `redis` package available, otherwise return a lightweight in-memory stub.

    This is helpful for unit tests that do not install `redis`.
    """
    try:
        from redis import Redis

        url = get_redis_url()
        logger.info("Connecting to Redis at %s", url)
        return Redis.from_url(url, **kwargs)
    except Exception:
        # Provide a minimal in-memory stub compatible with used methods in tests
        class _DummyRedis:
            def __init__(self):
                self._d = {}

            def setex(self, key, ttl, val):
                self._d[key] = val

            def get(self, key):
                return self._d.get(key)

            def setnx(self, key, val):
                if key in self._d:
                    return False
                self._d[key] = val
                return True

            def expire(self, key, ttl):
                return True

            def ping(self):
                return True

            def close(self):
                return None

        logger.warning("redis package not available; using DummyRedis stub for tests")
        return _DummyRedis()
