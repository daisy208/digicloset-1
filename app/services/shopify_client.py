"""Robust Shopify Admin API client with rate-limit handling and retries.

Features:
- Centralized `ShopifyClient` wrapping `requests.Session`.
- Exponential backoff with jitter and `Retry-After` support (max 5 attempts).
- Retries only on 429 and 5xx responses. For non-idempotent methods, caller must
  provide an `idempotency_key` to allow safe retries.
- Parses and logs `X-Shopify-Shop-Api-Call-Limit` to compute usage percentage.
- Structured logging and optional metrics hook.

Usage:
    client = ShopifyClient(shop_domain, access_token)
    resp = client.request("GET", "/admin/api/2023-10/products.json")

"""
from __future__ import annotations

import logging
import random
import time
from typing import Any, Dict, Optional, Tuple

import requests

logger = logging.getLogger(__name__)


def parse_shop_api_call_limit(header_value: str) -> Optional[Tuple[int, int]]:
    """Parse header like "12/40" into (used, bucket)."""
    try:
        used, bucket = header_value.split("/")
        return int(used), int(bucket)
    except Exception:
        return None


class ShopifyClient:
    def __init__(
        self,
        shop_domain: str,
        access_token: str,
        session: Optional[requests.Session] = None,
        max_retries: int = 5,
        backoff_base: float = 0.5,
        rate_warn_threshold: float = 0.8,
        metrics_hook: Optional[callable] = None,
    ) -> None:
        self.shop_domain = shop_domain
        self.access_token = access_token
        self.session = session or requests.Session()
        self.max_retries = int(max_retries)
        self.backoff_base = float(backoff_base)
        self.rate_warn_threshold = float(rate_warn_threshold)
        self.metrics_hook = metrics_hook

        # session defaults
        self.session.headers.update({
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": self.access_token,
        })

    def _emit_metric(self, name: str, payload: Dict[str, Any]) -> None:
        try:
            if self.metrics_hook:
                self.metrics_hook(name, payload)
        except Exception:
            logger.debug("metrics hook failed", exc_info=True)

    def _should_retry(self, method: str, response: requests.Response, attempt: int, idempotency: Optional[str]) -> bool:
        # Retry on 429 or 5xx
        status = response.status_code
        if status == 429:
            # allow retry for GET or if idempotency key provided for non-idempotent
            if method.upper() in ("GET", "HEAD", "OPTIONS"):
                return True
            return idempotency is not None
        if 500 <= status < 600:
            return True
        return False

    def _respect_rate_limit_header(self, response: requests.Response) -> None:
        hdr = response.headers.get("X-Shopify-Shop-Api-Call-Limit")
        if not hdr:
            return
        parsed = parse_shop_api_call_limit(hdr)
        if parsed:
            used, bucket = parsed
            pct = used / float(bucket) if bucket else 0.0
            self._emit_metric("shopify_api_usage", {"used": used, "bucket": bucket, "pct": pct})
            logger.debug("Shopify API call limit %d/%d (%.2f%%)", used, bucket, pct * 100)
            if pct >= self.rate_warn_threshold:
                logger.warning("Shopify API usage high: %.0f%% (%d/%d)", pct * 100, used, bucket)

    def _compute_backoff(self, attempt: int) -> float:
        base = self.backoff_base * (2 ** (attempt - 1))
        jitter = random.uniform(0, base)
        return base + jitter

    def request(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Any] = None,
        idempotency_key: Optional[str] = None,
        timeout: Optional[float] = 10.0,
    ) -> requests.Response:
        """Perform an HTTP request against Shopify Admin API with retry/backoff.

        - `path` is the path portion starting with `/admin` or full URL.
        - For non-idempotent methods (POST/PUT/PATCH/DELETE) provide `idempotency_key` to allow retries safely.
        """
        url = path if path.startswith("http") else f"https://{self.shop_domain}{path}"
        headers = {}
        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key

        attempt = 1
        last_exception: Optional[Exception] = None

        while attempt <= self.max_retries:
            try:
                logger.debug("ShopifyClient request attempt=%d method=%s url=%s", attempt, method, url)
                resp = self.session.request(method, url, params=params, json=json, headers=headers, timeout=timeout)
                # record rate limit usage
                self._respect_rate_limit_header(resp)

                if resp.ok:
                    self._emit_metric("shopify_request_success", {"status": resp.status_code, "attempt": attempt})
                    return resp

                # Non-OK: decide whether to retry
                if self._should_retry(method, resp, attempt, idempotency_key):
                    # honor Retry-After if present
                    ra = resp.headers.get("Retry-After")
                    if ra:
                        try:
                            wait = int(ra)
                        except ValueError:
                            # Could be HTTP-date; fall back to default backoff
                            wait = None
                        if wait:
                            logger.warning("Shopify returned Retry-After=%s; sleeping %s seconds", ra, wait)
                            self._emit_metric("shopify_retry_after", {"wait": wait})
                            time.sleep(wait)
                            attempt += 1
                            continue

                    backoff = self._compute_backoff(attempt)
                    logger.warning("Retrying Shopify request: attempt=%d status=%d backoff=%.2f", attempt, resp.status_code, backoff)
                    self._emit_metric("shopify_retry", {"attempt": attempt, "status": resp.status_code, "backoff": backoff})
                    time.sleep(backoff)
                    attempt += 1
                    continue

                # Non-retriable error
                self._emit_metric("shopify_request_failed", {"status": resp.status_code})
                resp.raise_for_status()

            except requests.RequestException as exc:
                last_exception = exc
                # For network-level errors, retry
                logger.warning("Network error during Shopify request: %s; attempt=%d", exc, attempt)
                self._emit_metric("shopify_network_error", {"attempt": attempt})
                backoff = self._compute_backoff(attempt)
                time.sleep(backoff)
                attempt += 1
                continue

        # Exhausted retries
        logger.error("Shopify request failed after %d attempts", self.max_retries)
        if last_exception:
            raise last_exception
        raise requests.HTTPError(f"Shopify request failed after {self.max_retries} attempts")
