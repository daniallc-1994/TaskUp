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
