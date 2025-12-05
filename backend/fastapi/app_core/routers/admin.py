from fastapi import APIRouter, Depends
from ..security import require_roles
from .. import db

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/metrics")
async def metrics(user=Depends(require_roles("admin", "support", "moderator"))):
    users = db.select("user_profiles")
    tasks = db.select("tasks")
    offers = db.select("offers")
    disputes = db.select("disputes")
    payments = db.select("payments")
    return {
        "users": len(users),
        "tasks": len(tasks),
        "offers": len(offers),
        "disputes": len(disputes),
        "payments": len(payments),
    }


@router.get("/users")
async def list_users(user=Depends(require_roles("admin", "support", "moderator"))):
    return db.select("user_profiles")


@router.post("/users/{user_id}/kyc")
async def set_kyc_status(user_id: str, kyc_status: str, user=Depends(require_roles("admin", "support", "moderator"))):
    db.update("user_profiles", {"id": user_id}, {"kyc_status": kyc_status})
    db.log_admin_action(user.get("id"), "set_kyc_status", "user", user_id, {"kyc_status": kyc_status})
    return {"ok": True}


@router.post("/users/{user_id}/risk")
async def set_risk_score(user_id: str, risk_score: float, note: str = "", user=Depends(require_roles("admin", "support", "moderator"))):
    db.update("user_profiles", {"id": user_id}, {"risk_score": risk_score})
    db.insert("fraud_flags", {"user_id": user_id, "note": note, "risk_score": risk_score})
    db.log_admin_action(user.get("id"), "set_risk_score", "user", user_id, {"risk_score": risk_score, "note": note})
    return {"ok": True}


@router.post("/users/{user_id}/flags")
async def add_flag(user_id: str, note: str, user=Depends(require_roles("admin", "support", "moderator"))):
    db.insert("fraud_flags", {"user_id": user_id, "note": note})
    db.log_admin_action(user.get("id"), "add_flag", "user", user_id, {"note": note})
    return {"ok": True}


@router.get("/tasks")
async def list_tasks(user=Depends(require_roles("admin", "support", "moderator"))):
    return db.select("tasks")


@router.get("/offers")
async def list_offers(user=Depends(require_roles("admin", "support", "moderator"))):
    return db.select("offers")


@router.get("/disputes")
async def list_disputes(user=Depends(require_roles("admin", "support", "moderator"))):
    return db.select("disputes")


@router.get("/payments")
async def list_payments(user=Depends(require_roles("admin", "support", "moderator"))):
    return db.select("payments")


@router.post("/block")
async def block_user(user_id: str, reason: str = "manual_block", user=Depends(require_roles("admin", "support", "moderator"))):
    db.insert("blocked_users", {"user_id": user_id, "reason": reason})
    db.update("user_profiles", {"id": user_id}, {"is_blocked": True})
    db.log_admin_action(user.get("id"), "block_user", "user", user_id, {"reason": reason})
    return {"ok": True, "blocked_user_id": user_id}
