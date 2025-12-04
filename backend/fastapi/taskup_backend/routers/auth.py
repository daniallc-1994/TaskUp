from fastapi import APIRouter, HTTPException, Request, Depends
from uuid import uuid4
from typing import Dict
from ..models import RegisterRequest, LoginRequest, User
from ..security import hash_password, verify_password, create_token
from ..rate_limit import check
from .. import db


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(request: Request, payload: RegisterRequest):
    ip = request.client.host
    check(ip, "register")
    email = payload.email.lower()
    existing = db.get_user_by_email(email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already in use")

    user_id = str(uuid4())
    hashed = hash_password(payload.password)
    db_user = db.create_user_profile(
        {
            "id": user_id,
            "email": email,
            "full_name": payload.full_name or payload.name or email.split("@")[0],
            "role": (payload.role or "client").lower(),
            "language": payload.language or "en",
            "hashed_password": hashed,
        }
    )
    if not db_user:
        raise HTTPException(status_code=500, detail="Could not create user")
    db.log_device_fingerprint(user_id, ip, payload.device_fingerprint)
    user = User(
        id=db_user["id"],
        email=db_user["email"],
        full_name=db_user.get("full_name"),
        role=db_user.get("role", "client"),
        language=db_user.get("language"),
    )
    token = create_token(user.id, user.email, user.role)
    return {"ok": True, "user": user, "access_token": token, "token_type": "bearer"}


@router.post("/login")
async def login(request: Request, payload: LoginRequest):
    ip = request.client.host
    check(ip, "login")
    email = payload.email.lower()
    db_user = db.get_user_by_email(email)
    if not db_user or not verify_password(payload.password, db_user.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if db_user.get("is_blocked"):
        raise HTTPException(status_code=403, detail="Account blocked")
    db.log_device_fingerprint(db_user["id"], ip, payload.device_fingerprint)
    user = User(
        id=db_user["id"],
        email=db_user["email"],
        full_name=db_user.get("full_name"),
        role=db_user.get("role", "client"),
        language=db_user.get("language"),
    )
    token = create_token(user.id, user.email, user.role)
    return {"ok": True, "user": user, "access_token": token, "token_type": "bearer"}


from ..security import get_current_user


@router.get("/me")
async def me(user=Depends(get_current_user)):
    return {"user": user}
