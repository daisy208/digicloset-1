# config/security/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, FastAPI
from fastapi.responses import JSONResponse

limiter = Limiter(key_func=lambda request: request.headers.get("x-api-key") or get_remote_address(request))

def setup_rate_limit(app: FastAPI):
    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        return JSONResponse(status_code=429, content={"error": "Rate limit exceeded"})
    app.state.limiter = limiter
    app.middleware("http")(limiter.middleware)