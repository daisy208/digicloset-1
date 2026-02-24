import asyncio
import logging
import threading
import time
from typing import Any, Callable, Dict, Optional

logger = logging.getLogger(__name__)


class CircuitOpenError(Exception):
    pass


class AIServiceWithCircuitBreaker:
    """Wraps an existing AIService and provides timeout + circuit breaker.

    Behavior:
    - Uses `asyncio.wait_for` to bound inference time (configurable).
    - Tracks consecutive failures; once >= `failure_threshold`, moves to OPEN.
    - While OPEN, requests immediately receive a fallback response until
      `reset_timeout` has elapsed, then transitions to HALF-OPEN.
    - On a successful call in HALF-OPEN, transitions to CLOSED and resets counters.

    Thread-safety:
    - Uses a `threading.Lock` for shared counters to be safe across threads.
    - Uses asyncio primitives for async inference.
    """

    def __init__(
        self,
        ai_service: Any,
        failure_threshold: int = 3,
        reset_timeout: float = 30.0,
        timeout: float = 5.0,
        metrics_callback: Optional[Callable[[str, Dict[str, Any]], None]] = None,
    ) -> None:
        self._ai = ai_service
        self.failure_threshold = int(failure_threshold)
        self.reset_timeout = float(reset_timeout)
        self.timeout = float(timeout)
        self._metrics = metrics_callback

        # Circuit state
        self._failure_count = 0
        self._state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
        self._last_failure_time: Optional[float] = None

        # Protect counters and state
        self._lock = threading.Lock()

    def _emit_metric(self, name: str, payload: Dict[str, Any]) -> None:
        try:
            if self._metrics:
                self._metrics(name, payload)
        except Exception:
            logger.debug("Metrics hook failed for %s", name, exc_info=True)

    def _enter_open(self) -> None:
        with self._lock:
            self._state = "OPEN"
            self._last_failure_time = time.monotonic()
        logger.warning("Circuit breaker opened after %d failures", self._failure_count)
        self._emit_metric("circuit_open", {"failures": self._failure_count})

    def _try_reset(self) -> None:
        # If reset_timeout has elapsed, move to HALF_OPEN
        with self._lock:
            if self._state != "OPEN" or self._last_failure_time is None:
                return
            if time.monotonic() - self._last_failure_time >= self.reset_timeout:
                self._state = "HALF_OPEN"
                logger.info("Circuit breaker transitioned to HALF_OPEN (trial)")
                self._emit_metric("circuit_half_open", {})

    def _record_success(self) -> None:
        with self._lock:
            self._failure_count = 0
            previous = self._state
            self._state = "CLOSED"
            self._last_failure_time = None
        if previous != "CLOSED":
            logger.info("Circuit breaker reset to CLOSED after successful call")
            self._emit_metric("circuit_reset", {})

    def _record_failure(self) -> None:
        with self._lock:
            self._failure_count += 1
            failures = self._failure_count
        logger.debug("Circuit failure count incremented: %d", failures)
        self._emit_metric("circuit_failure", {"failures": failures})
        if failures >= self.failure_threshold:
            self._enter_open()

    def _fallback(self, prompt: str, max_tokens: int) -> Dict[str, Any]:
        logger.warning("Returning fallback response due to open circuit or failure")
        self._emit_metric("inference_fallback", {"model": getattr(self._ai, "model_name", None)})
        return {"text": "[unavailable]", "confidence": 0.0, "model": getattr(self._ai, "model_name", None)}

    async def infer(self, prompt: str, max_tokens: int = 128, timeout: Optional[float] = None) -> Dict[str, Any]:
        # If open, check reset window
        if self._state == "OPEN":
            self._try_reset()
            if self._state == "OPEN":
                logger.warning("Circuit is OPEN; serving fallback without calling model")
                return self._fallback(prompt, max_tokens)

        # At this point state is CLOSED or HALF_OPEN; attempt call with timeout
        effective_timeout = float(timeout) if timeout is not None else self.timeout
        try:
            coro = self._ai.infer(prompt, max_tokens=max_tokens, timeout=effective_timeout)
            result = await asyncio.wait_for(coro, timeout=effective_timeout)
        except asyncio.TimeoutError:
            logger.exception("Inference timed out after %.2fs", effective_timeout)
            self._record_failure()
            # If breaker opened as a result, return fallback
            if self._state == "OPEN":
                return self._fallback(prompt, max_tokens)
            raise
        except Exception:
            logger.exception("Inference raised an exception")
            self._record_failure()
            if self._state == "OPEN":
                return self._fallback(prompt, max_tokens)
            raise

        # Success
        self._record_success()
        return result
