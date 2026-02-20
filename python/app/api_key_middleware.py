# config/security/api_key_middleware.py
from fastapi import Request, HTTPException
from supabase import create_client, Client
from .audit_logger import audit_log

import os

supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

async def api_key_dependency(request: Request):
    key = request.headers.get("x-api-key")
    if not key:
        raise HTTPException(status_code=401, detail="Missing API key")

    res = supabase.table("api_keys").select("*").eq("key", key).eq("revoked", False).execute()
    data = res.data
    if not data:
        raise HTTPException(status_code=403, detail="Invalid or expired API key")

    user = data[0].get("owner_id")
    audit_log("ACCESS", {"user": user, "endpoint": request.url.path})
    request.state.api_user = user
    return user
    import jwt
from fastapi import Request, HTTPException
from app.core import SHOPIFY_API_SECRET, SHOPIFY_API_KEY

async def verify_shopify_session(request: Request):
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing token")

    token = auth_header.split(" ")[1]

    try:
        decoded = jwt.decode(
            token,
            SHOPIFY_API_SECRET,
            algorithms=["HS256"],
            audience=SHOPIFY_API_KEY,
        )
        request.state.shop = decoded["dest"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
