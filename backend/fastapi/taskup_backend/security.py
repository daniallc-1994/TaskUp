import os
import time
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status, Header
from passlib.hash import bcrypt
from sqlalchemy.orm import Session

from .database import get_db
from .models import User

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


async def get_current_user(
    authorization: Optional[str] = Header(None), db: Session = Depends(get_db)
) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    user_id = payload.get("sub") or payload.get("user_id")
    profile: Optional[User] = db.query(User).filter(User.id == user_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    # Normalize keys for downstream code
    return {
        "id": profile.id,
        "uid": profile.id,
        "role": profile.role.value if hasattr(profile.role, "value") else profile.role,
        "email": profile.email,
        "full_name": profile.full_name,
        "language": profile.language,
        "token": token,
    }


def require_roles(*roles: str):
    async def _dep(user=Depends(get_current_user)):
        if user.get("role") not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user

    return _dep
