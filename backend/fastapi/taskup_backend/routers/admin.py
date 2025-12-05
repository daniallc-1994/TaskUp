from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..security import require_roles
from ..database import get_db
from ..models import User, Task, Offer, Dispute, Payment
from ..notifications import create_notification
from ..admin_logs import log_admin_action
from ..errors import not_found_error
from ..logging_utils import log_event

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/metrics")
async def metrics(user=Depends(require_roles("admin", "support", "moderator")), db: Session = Depends(get_db)):
    users = db.query(User).count()
    tasks = db.query(Task).count()
    offers = db.query(Offer).count()
    disputes = db.query(Dispute).count()
    payments = db.query(Payment).count()
    return {
        "users": users,
        "tasks": tasks,
        "offers": offers,
        "disputes": disputes,
        "payments": payments,
    }


@router.get("/users")
async def list_users(user=Depends(require_roles("admin", "support", "moderator")), db: Session = Depends(get_db)):
    return db.query(User).all()


@router.post("/users/{user_id}/kyc")
async def set_kyc_status(user_id: str, kyc_status: str, user=Depends(require_roles("admin", "support", "moderator")), db: Session = Depends(get_db)):
    updated = db.query(User).filter(User.id == user_id).update({"kyc_status": kyc_status})
    if not updated:
        raise not_found_error("USER_NOT_FOUND", "User not found")
    db.commit()
    log_admin_action(db, user.get("id"), "set_kyc_status", "user", user_id, {"kyc_status": kyc_status})
    log_event(user_id=user.get("id"), action="admin_set_kyc", extra={"user_id": user_id, "kyc_status": kyc_status})
    return {"ok": True}


@router.post("/users/{user_id}/risk")
async def set_risk_score(user_id: str, risk_score: float, note: str = "", user=Depends(require_roles("admin", "support", "moderator")), db: Session = Depends(get_db)):
    updated = db.query(User).filter(User.id == user_id).update({"risk_score": risk_score, "flags": {"note": note}})
    if not updated:
        raise not_found_error("USER_NOT_FOUND", "User not found")
    db.commit()
    log_admin_action(db, user.get("id"), "set_risk_score", "user", user_id, {"risk_score": risk_score, "note": note})
    log_event(user_id=user.get("id"), action="admin_set_risk", extra={"user_id": user_id, "risk_score": risk_score})
    return {"ok": True}


@router.get("/tasks")
async def list_tasks(user=Depends(require_roles("admin", "support", "moderator")), db: Session = Depends(get_db)):
    return db.query(Task).all()


@router.get("/offers")
async def list_offers(user=Depends(require_roles("admin", "support", "moderator")), db: Session = Depends(get_db)):
    return db.query(Offer).all()


@router.get("/disputes")
async def list_disputes(user=Depends(require_roles("admin", "support", "moderator")), db: Session = Depends(get_db)):
    return db.query(Dispute).all()


@router.get("/payments")
async def list_payments(user=Depends(require_roles("admin", "support", "moderator")), db: Session = Depends(get_db)):
    return db.query(Payment).all()


@router.post("/block")
async def block_user(user_id: str, reason: str = "manual_block", user=Depends(require_roles("admin", "support", "moderator")), db: Session = Depends(get_db)):
    updated = db.query(User).filter(User.id == user_id).update({"flags": {"blocked": True, "reason": reason}})
    if not updated:
        raise not_found_error("USER_NOT_FOUND", "User not found")
    db.commit()
    create_notification(db, user_id, "account_blocked", "Account blocked", reason)
    log_admin_action(db, user.get("id"), "block_user", "user", user_id, {"reason": reason})
    log_event(user_id=user.get("id"), action="admin_block_user", extra={"target_user": user_id, "reason": reason})
    return {"ok": True, "blocked_user_id": user_id}


@router.post("/unblock")
async def unblock_user(user_id: str, user=Depends(require_roles("admin", "support", "moderator")), db: Session = Depends(get_db)):
    updated = db.query(User).filter(User.id == user_id).update({"flags": {"blocked": False}})
    if not updated:
        raise not_found_error("USER_NOT_FOUND", "User not found")
    db.commit()
    create_notification(db, user_id, "account_unblocked", "Account unblocked", "")
    log_admin_action(db, user.get("id"), "unblock_user", "user", user_id, {})
    log_event(user_id=user.get("id"), action="admin_unblock_user", extra={"target_user": user_id})
    return {"ok": True, "unblocked_user_id": user_id}
