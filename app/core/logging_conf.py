from __future__ import annotations

import logging
import os
from pythonjsonlogger import jsonlogger
from typing import Any, Dict


def configure_logging(level: str | None = None) -> None:
    """Configure global structured JSON logging with a request-aware formatter.

    This sets a JSON formatter that includes timestamp, level, message and any
    extra context (e.g., shop_domain, request_id) provided by `LoggerAdapter`.
    """
    log_level = (level or os.getenv("LOG_LEVEL") or "INFO").upper()
    handler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter('%(asctime)s %(levelname)s %(name)s %(message)s %(request_id)s %(shop_domain)s')
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.setLevel(getattr(logging, log_level, logging.INFO))
    # Clear existing handlers to avoid duplicate logs in some environments
    root.handlers = []
    root.addHandler(handler)


def get_structured_logger(name: str) -> logging.Logger:
    configure_logging()
    return logging.getLogger(name)
