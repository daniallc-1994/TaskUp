from fastapi import APIRouter, HTTPException, Depends
from uuid import uuid4
from typing import List
from ..models import Dispute, DisputeCreate, DisputeResolve
from ..security import get_current_user, require_roles
from .. import db


router = APIRouter(prefix="/disputes", tags=["disputes"])


def _normalize(raw: dict) -> dict:
    raw = raw or {}
    if "id" not in raw:
        raw["id"] = str(uuid4())
    return raw


@router.get("", response_model=List[Dispute])
async def list_disputes(user=Depends(get_current_user)):
    disputes = db.list_disputes_for_user(user.get("id"), user.get("role", "client"), jwt=user.get("token"))
    return [Dispute(**_normalize(d)) for d in disputes]


@router.post("", response_model=Dispute)
async def open_dispute(payload: DisputeCreate, user=Depends(get_current_user)):
    dispute = db.open_dispute(
        {
            "task_id": payload.task_id,
            "payment_id": payload.payment_id,
            "opened_by": user.get("id"),
            "reason": payload.reason,
            "status": "open",
        },
        jwt=user.get("token"),
    )
    if dispute:
        return Dispute(**_normalize(dispute))
    created = Dispute(
        id=str(uuid4()),
        task_id=payload.task_id,
        payment_id=payload.payment_id,
        opened_by=user.get("id"),
        reason=payload.reason,
        status="open",
    )
    return created


@router.post("/{dispute_id}/resolve")
async def resolve_dispute(dispute_id: str, payload: DisputeResolve, user=Depends(require_roles("admin", "support", "moderator"))):
    status = (
        "resolved_release"
        if payload.resolution == "release"
        else "resolved_refund"
        if payload.resolution == "refund"
        else "dismissed"
    )
    dispute = db.update_dispute(dispute_id, {"status": status}, jwt=user.get("token"))
    if dispute:
        db.log_admin_action(user.get("id"), f"dispute_{payload.resolution}", "dispute", dispute_id, {"note": payload.note})
        return {"ok": True, "dispute": dispute}
    raise HTTPException(status_code=404, detail="Dispute not found")
