from fastapi import Header, HTTPException
from typing import Optional

from .storage import JSONStore

store = JSONStore()


def get_user_from_api_key(x_api_key: Optional[str] = Header(None)) -> dict:
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-KEY header")
    user = store.get_user_by_api_key(x_api_key)
    if not user:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return user


def require_role(role: str):
    def _dependency(x_api_key: Optional[str] = Header(None)):
        user = get_user_from_api_key(x_api_key)
        roles = user.get("roles", [])
        if role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient role")
        return user

    return _dependency
