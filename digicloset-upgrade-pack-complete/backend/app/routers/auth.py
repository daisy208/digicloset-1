# NOTE: This router implements B2C user authentication flows.
# DigiCloset B2B pivot: These endpoints are deprioritized and will be removed in a future release.
# Do not delete yet. See REFRACTOR_PLAN.md for details.
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

from ..core import settings

router = APIRouter()

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserRegister(BaseModel):
    email: str
    password: str
    name: str | None = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# NOTE: This skeleton uses an in-memory store for demo. Replace with DB access.
_users = {}

@router.post('/register', response_model=dict)
async def register(u: UserRegister):
    if u.email in _users:
        raise HTTPException(status_code=400, detail='User already exists')
    hashed = pwd_ctx.hash(u.password)
    _users[u.email] = {"email": u.email, "name": u.name, "hashed": hashed}
    return {"email": u.email, "name": u.name}

@router.post('/login', response_model=Token)
async def login(form: UserRegister):
    user = _users.get(form.email)
    if not user or not pwd_ctx.verify(form.password, user['hashed']):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    to_encode = {"sub": form.email, "exp": datetime.utcnow() + timedelta(hours=12)}
    token = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}
