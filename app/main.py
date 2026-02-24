from fastapi import FastAPI
from app.api.router import api_router
from app.ai.services.ai_service import AIService
from app.ai.services.ai_with_cb import AIServiceWithCircuitBreaker
from app.core.config import settings
from app.core.tenant import tenant_middleware
from app.core.metrics_middleware import metrics_middleware
from jobs.redis_conn import get_redis_connection
from fastapi.middleware.cors import CORSMiddleware
from app.core.request_id import request_id_middleware
from app.core.logging_conf import configure_logging
from app.core.exceptions import global_exception_handler
from app.middleware.timeout import request_timeout_middleware
from app.api.oauth import router as oauth_router
from app.api.webhooks import router as webhooks_router
from app.middleware.observability import latency_middleware
from app.middleware.billing import billing_enforcement_middleware
import os


# Configure structured logging early
configure_logging()
from app.api.ai_infer import router as ai_infer_router


app = FastAPI(title=settings.app_name)

# Expose simple policy and terms routes
@app.get("/privacy")
def privacy():
    try:
        with open("static/privacy.md") as f:
            return f.read()
    except Exception:
        return ""


@app.get("/terms")
def terms():
    try:
        with open("static/terms.md") as f:
            return f.read()
    except Exception:
        return ""

# Configure CORS from environment
origins = settings.allowed_origins
if origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

app.middleware("http")(metrics_middleware)
app.middleware("http")(request_timeout_middleware)
app.middleware("http")(latency_middleware)

# Billing enforcement should run after tenant middleware (tenant_middleware attaches tenant)


@app.on_event("startup")
async def startup_event() -> None:
    """Initialize shared services on startup."""
    # Attach a shared AI service instance wrapped with circuit breaker
    base = AIService(model_name=None)
    failure_threshold = int(__import__("os").environ.get("AI_CB_FAILURE_THRESHOLD", "3"))
    reset_timeout = float(__import__("os").environ.get("AI_CB_RESET_TIMEOUT", "30"))
    timeout = float(__import__("os").environ.get("AI_INFERENCE_TIMEOUT", str(settings.ai_inference_timeout)))
    app.state.ai_service = AIServiceWithCircuitBreaker(
        base, failure_threshold=failure_threshold, reset_timeout=reset_timeout, timeout=timeout
    )

    # Initialize Redis connection for shared services (cache, sessions, queues)
    try:
        app.state.redis = get_redis_connection()
    except Exception:
        app.state.redis = None

    # Provide a simple cleanup hook (override in tests or real implementation)
    async def _cleanup_shop(shop_domain: str) -> None:
        # Placeholder to revoke tokens and remove DB records
        return None

    app.dependency_overrides = getattr(app, "dependency_overrides", {})
    app.dependency_overrides["shopify_cleanup"] = _cleanup_shop

    # Basic environment validation (enforce only when ENFORCE_CONFIG=1)
    enforce = os.environ.get("ENFORCE_CONFIG", "0") == "1"
    missing = []
    if not settings.shopify_api_key:
        missing.append("SHOPIFY_API_KEY")
    if not settings.shopify_api_secret:
        missing.append("SHOPIFY_API_SECRET")
    if not os.environ.get("CONTACT_EMAIL"):
        missing.append("CONTACT_EMAIL")
    if missing:
        msg = f"Missing required env vars: {', '.join(missing)}"
        if enforce:
            raise RuntimeError(msg)
        else:
            logging.getLogger(__name__).warning("%s (set ENFORCE_CONFIG=1 to enforce)", msg)


# Tenant isolation middleware must run for all API requests to guarantee a tenant
# context is available and to reject requests missing tenant headers.
app.middleware("http")(request_id_middleware)
app.middleware("http")(tenant_middleware)
app.middleware("http")(billing_enforcement_middleware)

# Register global exception handler
app.add_exception_handler(Exception, global_exception_handler)


# Mount application routers under /api
app.include_router(api_router, prefix="/api")

# Auth and webhook endpoints (mounted under /api) - these bypass tenant header requirements
app.include_router(oauth_router, prefix="/api")
app.include_router(webhooks_router, prefix="/api")

# Expose AI endpoints at top-level `/ai` for backwards/explicit compatibility
app.include_router(ai_infer_router)


@app.get("/health")
def health() -> dict:
    """Health check endpoint used by load balancers and tests."""
    ok = True
    details = {"ai_service": True}
    # quick Redis readiness check
    try:
        if getattr(app.state, "redis", None) is None:
            details["redis"] = False
            ok = False
        else:
            details["redis"] = app.state.redis.ping()
            if not details["redis"]:
                ok = False
    except Exception:
        details["redis"] = False
        ok = False
    return {"status": "ok" if ok else "unhealthy", "details": details}


@app.on_event("shutdown")
async def shutdown_event() -> None:
    # Clean up resources
    try:
        r = getattr(app.state, "redis", None)
        if r is not None:
            r.close()
    except Exception:
        pass
