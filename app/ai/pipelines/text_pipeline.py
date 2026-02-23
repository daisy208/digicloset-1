import asyncio
import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

# Simple in-memory cache for pipelines keyed by model name
_PIPELINE_CACHE: Dict[str, Any] = {}


async def get_text_pipeline(model_name: Optional[str] = None) -> Any:
    """Lazily load and cache a text-generation pipeline.

    This function delays importing `transformers` until actually needed.
    Tests can avoid downloading models by mocking this function.
    """
    name = model_name or "gpt2"
    if name in _PIPELINE_CACHE:
        return _PIPELINE_CACHE[name]

    # Avoid concurrent loads for the same model
    lock = asyncio.Lock()
    async with lock:
        if name in _PIPELINE_CACHE:
            return _PIPELINE_CACHE[name]
        try:
            import importlib
            transformers = importlib.import_module("transformers")
            pipeline = getattr(transformers, "pipeline")
            pl = pipeline("text-generation", model=name)
            _PIPELINE_CACHE[name] = pl
            logger.info("Text pipeline loaded for model: %s", name)
            return pl
        except Exception as exc:
            logger.exception("Failed to load text pipeline for %s: %s", name, exc)
            raise
