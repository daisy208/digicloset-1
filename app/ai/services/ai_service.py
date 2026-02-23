import os
import asyncio
import logging
from typing import Any, Dict, Optional
from functools import partial

logger = logging.getLogger(__name__)


class AIService:
    """Central AI service abstraction with lazy model loading and caching.

    - Imports heavy model libraries lazily to avoid startup overhead.
    - Uses threadpool to run blocking inference so endpoints remain async.
    - Exposes a simple `infer` coroutine.
    """

    def __init__(self, model_name: Optional[str] = None) -> None:
        self.model_name = model_name or os.getenv("AI_MODEL_NAME", "gpt2")
        self._pipeline = None
        self._load_lock = asyncio.Lock()

    async def _load_pipeline(self) -> Any:
        if self._pipeline:
            return self._pipeline
        async with self._load_lock:
            if self._pipeline:
                return self._pipeline
            # Lazy import to avoid requiring transformers at import-time
            # Delegate to the pipeline loader which handles caching and lazy imports
            from app.ai.pipelines.text_pipeline import get_text_pipeline

            try:
                self._pipeline = await get_text_pipeline(self.model_name)
            except Exception as e:
                logger.exception("Failed to initialize pipeline: %s", e)
                raise RuntimeError("Model libraries are not available") from e
            logger.info("Loaded model pipeline: %s", self.model_name)
            return self._pipeline

    async def infer(self, prompt: str, max_tokens: int = 128, timeout: float = 10.0) -> Dict[str, Any]:
        """Run inference asynchronously with timeout and basic structured response.

        Returns a dict with `text`, `confidence`, and `model` keys.
        """
        try:
            pipeline = await self._load_pipeline()
        except RuntimeError:
            # graceful degradation
            logger.warning("Model unavailable; returning degraded response")
            return {"text": "[model unavailable]", "confidence": 0.0, "model": None}

        loop = asyncio.get_running_loop()
        # Prepare blocking call in executor
        func = partial(pipeline, prompt, max_length=max_tokens)
        try:
            import time
            start = time.perf_counter()
            result = await asyncio.wait_for(loop.run_in_executor(None, func), timeout=timeout)
            elapsed = time.perf_counter() - start
            logger.info("Inference completed in %.3fs for model=%s", elapsed, self.model_name)
        except asyncio.TimeoutError:
            logger.exception("Model inference timed out")
            return {"text": "[timeout]", "confidence": 0.0, "model": self.model_name}
        except Exception:
            logger.exception("Model inference failed")
            return {"text": "[inference_error]", "confidence": 0.0, "model": self.model_name}

        # Transformers `text-generation` pipeline returns a list of dicts
        if isinstance(result, list) and result:
            text = result[0].get("generated_text") or result[0].get("text") or ""
        else:
            text = str(result)

        # Simple heuristic confidence; downstream can replace with calibrated scores
        confidence = 0.9 if text else 0.0
        return {"text": text, "confidence": confidence, "model": self.model_name}
