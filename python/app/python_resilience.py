# config/resilience/python_resilience.py
import httpx, asyncio, os, time
from prometheus_client import Counter, Gauge

retry_counter = Counter('python_request_retries_total', 'Total number of request retries')
circuit_state = Gauge('python_circuit_state', '0=closed,1=open,2=half-open')

RETRY_COUNT = int(os.getenv('RETRY_COUNT', '3'))
BACKOFF_MS = int(os.getenv('BACKOFF_MS', '1000'))
CIRCUIT_TIMEOUT_SEC = int(os.getenv('CIRCUIT_TIMEOUT_SEC', '60'))

_circuit_open_until = 0

async def resilient_request(url, method='GET', **kwargs):
    global _circuit_open_until

    if time.time() < _circuit_open_until:
        circuit_state.set(1)
        raise Exception("Circuit breaker open")

    for attempt in range(RETRY_COUNT + 1):
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.request(method, url, **kwargs)
                if response.status_code >= 500:
                    raise Exception("Server error")
                circuit_state.set(0)
                return response
        except Exception as e:
            retry_counter.inc()
            if attempt < RETRY_COUNT:
                await asyncio.sleep(BACKOFF_MS / 1000.0)
            else:
                _circuit_open_until = time.time() + CIRCUIT_TIMEOUT_SEC
                circuit_state.set(1)
                raise e