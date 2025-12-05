from datetime import datetime, timedelta
from uuid import uuid4
from fastapi import APIRouter, Request, Depends, status
from sqlalchemy.orm import Session

from ..schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserOut,
    ProfileUpdate,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from ..models import User, UserRole, Wallet, DeviceFingerprint
from ..security import hash_password, verify_password, create_token, get_current_user
from ..database import get_db
from ..rate_limit import check
from ..errors import (
    TaskUpError,
    auth_error,
    validation_error,
    not_found_error,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _log_device(db: Session, user_id: str, request: Request, fingerprint: str | None):
    ip = request.client.host if request and request.client else "unknown"
    df = DeviceFingerprint(id=str(uuid4()), user_id=user_id, ip_address=ip, fingerprint=fingerprint or ip)
    db.add(df)


def _user_response(user: User, token: str | None = None) -> TokenResponse:
    return TokenResponse(
        ok=True,
        user=UserOut(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role.value if hasattr(user.role, "value") else user.role,
            language=user.language,
            created_at=user.created_at,
            updated_at=user.updated_at,
            stripe_customer_id=user.stripe_customer_id,
            kyc_status=user.kyc_status,
            risk_score=user.risk_score,
            flags=user.flags,
        ),
        access_token=token or "",
    )


@router.post("/register", response_model=TokenResponse)
async def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)):
    ip = request.client.host
    check(ip, "register")
    email = payload.email.lower()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise TaskUpError(code="AUTH_EMAIL_EXISTS", message="Email already in use", type="conflict", http_status=409)

    user = User(
        id=str(uuid4()),
        email=email,
        full_name=payload.full_name or payload.name or email.split("@")[0],
        role=payload.role or UserRole.client,
        language=payload.language or "en",
        hashed_password=hash_password(payload.password),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(user)
    # create wallet
    wallet = Wallet(id=str(uuid4()), user_id=user.id, currency="NOK")
    db.add(wallet)
    db.commit()
    db.refresh(user)
    _log_device(db, user.id, request, payload.device_fingerprint)
    db.commit()
    token = create_token(user.id, user.email, user.role.value if hasattr(user.role, "value") else user.role)
    return _user_response(user, token)


@router.post("/login", response_model=TokenResponse)
async def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    ip = request.client.host
    check(ip, "login")
    email = payload.email.lower()
    user: User | None = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise auth_error("AUTH_INVALID_CREDENTIALS", "Invalid credentials", http_status=401)
    token = create_token(user.id, user.email, user.role.value if hasattr(user.role, "value") else user.role)
    _log_device(db, user.id, request, payload.device_fingerprint)
    db.commit()
    return _user_response(user, token)


@router.get("/me")
async def me(user=Depends(get_current_user)):
    return {"user": user}


@router.patch("/profile", response_model=UserOut)
async def update_profile(payload: ProfileUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db_user: User | None = db.query(User).filter(User.id == user["id"]).first()
    if not db_user:
        raise not_found_error("USER_NOT_FOUND", "User not found")
    if payload.full_name is not None:
        db_user.full_name = payload.full_name
    if payload.language is not None:
        db_user.language = payload.language
    db_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_user)
    return UserOut.from_orm(db_user)


@router.post("/change-password")
async def change_password(payload: ChangePasswordRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db_user: User | None = db.query(User).filter(User.id == user["id"]).first()
    if not db_user:
        raise not_found_error("USER_NOT_FOUND", "User not found")
    if not verify_password(payload.old_password, db_user.hashed_password):
        raise validation_error({"old_password": ["Old password incorrect"]})
    db_user.hashed_password = hash_password(payload.new_password)
    db_user.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.lower()
    db_user: User | None = db.query(User).filter(User.email == email).first()
    # Return generic message regardless
    if db_user:
        token = str(uuid4())
        db_user.reset_token = token
        db_user.reset_token_expires_at = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        # Stub for email send
        print(f"[auth] Password reset token for {email}: {token}")
    return {"ok": True, "message": "If that email exists, reset instructions have been sent."}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    db_user: User | None = (
        db.query(User)
        .filter(User.reset_token == payload.token, User.reset_token_expires_at > datetime.utcnow())
        .first()
    )
    if not db_user:
        raise validation_error({"token": ["Invalid or expired token"]})
    db_user.hashed_password = hash_password(payload.new_password)
    db_user.reset_token = None
    db_user.reset_token_expires_at = None
    db_user.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True}
