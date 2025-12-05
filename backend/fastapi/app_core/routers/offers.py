from fastapi import APIRouter, HTTPException, Depends
from uuid import uuid4
from typing import List
from ..models import Offer, OfferCreate
from ..security import get_current_user, require_roles
from ..rate_limit import check
from .. import db
from ..notifications import send_in_app_notification


router = APIRouter(prefix="/offers", tags=["offers"])


def _normalize_offer(raw: dict) -> dict:
    raw = raw or {}
    if "id" not in raw:
        raw["id"] = str(uuid4())
    return raw


@router.get("", response_model=List[Offer])
async def list_offers(task_id: str | None = None, user=Depends(get_current_user)):
    if task_id:
        data = db.list_offers_for_task(task_id, jwt=user.get("token"))
    else:
        data = db.list_offers_for_user(user["id"], user.get("role", "client"), jwt=user.get("token"))
    return [Offer(**_normalize_offer(o)) for o in data]


@router.post("", response_model=Offer)
async def create_offer(payload: OfferCreate, user=Depends(require_roles("tasker", "admin"))):
    check(user.get("id"), "offer_create", limit=120, window_seconds=600)
    supa = db.create_offer(
        {
            "task_id": payload.task_id,
            "tasker_id": user["id"],
            "amount_cents": payload.amount_cents,
            "message": payload.message,
            "eta_minutes": payload.eta_minutes,
            "status": "pending",
        },
        jwt=user.get("token"),
    )
    if supa:
        send_in_app_notification(user["id"], "offer_created", {"task_id": payload.task_id, "offer_id": supa.get("id")})
        return Offer(**_normalize_offer(supa))
    created = Offer(
        id=str(uuid4()),
        task_id=payload.task_id,
        tasker_id=user["id"],
        amount_cents=payload.amount_cents,
        message=payload.message,
        eta_minutes=payload.eta_minutes,
        status="pending",
    )
    return created


@router.post("/{offer_id}/status")
async def set_offer_status(offer_id: str, status: str, user=Depends(get_current_user)):
    updated = db.set_offer_status(offer_id, status, jwt=user.get("token"))
    if updated:
        return {"ok": True, "offer": updated}
    raise HTTPException(status_code=404, detail="Offer not found")
