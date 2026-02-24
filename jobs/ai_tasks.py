import logging
import os
from typing import Dict, Any
from app.ai.services.ai_service import AIService
from app.ai.services.ai_with_cb import AIServiceWithCircuitBreaker

logger = logging.getLogger(__name__)

# Create a module-level AIService wrapper instance for worker reuse
_ai_service: AIServiceWithCircuitBreaker | None = None


def get_ai_service() -> AIServiceWithCircuitBreaker:
    global _ai_service
    if _ai_service is None:
        model = os.getenv("AI_MODEL_NAME", None)
        base = AIService(model_name=model)
        failure_threshold = int(os.getenv("AI_CB_FAILURE_THRESHOLD", "3"))
        reset_timeout = float(os.getenv("AI_CB_RESET_TIMEOUT", "30"))
        timeout = float(os.getenv("AI_INFERENCE_TIMEOUT", "5"))
        _ai_service = AIServiceWithCircuitBreaker(
            base,
            failure_threshold=failure_threshold,
            reset_timeout=reset_timeout,
            timeout=timeout,
        )
    return _ai_service


def process_inference(prompt: str, max_tokens: int = 128) -> Dict[str, Any]:
    """RQ job function: runs heavy AI inference in a worker process.

    Returns a structured dict: {text, confidence, model}
    """
    ai = get_ai_service()
    logger.info("Worker starting inference task for model=%s", ai.model_name)
    try:
        # AIService.infer is async; run it via asyncio loop in this process
        import asyncio

        result = asyncio.run(ai.infer(prompt, max_tokens=max_tokens, timeout=float(os.getenv("AI_INFERENCE_TIMEOUT", "30"))))
        logger.info("Worker finished inference task")
        return result
    except Exception as exc:
        logger.exception("Inference job failed: %s", exc)
        # Re-raise so the job is marked as failed and the error is persisted
        raise
