import os
import time
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status, Header
from . import db
from passlib.hash import bcrypt

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALG = "HS256"
JWT_EXP_SECONDS = 60 * 60 * 24


def hash_password(password: str) -> str:
    return bcrypt.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.verify(password, hashed)
    except Exception:
        return False


def create_token(user_id: str, email: str, role: str = "client") -> str:
    payload = {"sub": user_id, "email": email, "role": role, "exp": int(time.time()) + JWT_EXP_SECONDS}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    user_id = payload.get("sub") or payload.get("user_id")
    profile = db.get_user_by_id(user_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    # Normalize keys for downstream code
    profile["id"] = profile.get("id") or user_id
    profile["uid"] = profile.get("id")
    profile["role"] = profile.get("role", payload.get("role", "client"))
    profile["email"] = profile.get("email", payload.get("email"))
    profile["token"] = token
    return profile


def require_roles(*roles: str):
    async def _dep(user=Depends(get_current_user)):
        if user.get("role") not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user

    return _dep
