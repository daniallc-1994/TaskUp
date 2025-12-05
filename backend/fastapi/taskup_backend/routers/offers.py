from fastapi import APIRouter, Depends
from uuid import uuid4
from typing import List
from datetime import datetime
from sqlalchemy.orm import Session
from ..schemas import OfferOut, OfferCreate
from ..security import get_current_user, require_roles
from ..rate_limit import check
from ..database import get_db
from ..models import Offer, Task, OfferStatus, TaskStatus
from ..notifications import send_in_app_notification
from ..notifications import create_notification
from ..errors import permission_error, not_found_error, conflict_error
from ..logging_utils import log_event
from ..admin_logs import log_admin_action

router = APIRouter(prefix="/offers", tags=["offers"])


@router.get("", response_model=List[OfferOut])
async def list_offers(task_id: str | None = None, user=Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Offer)
    if task_id:
        query = query.filter(Offer.task_id == task_id)
    if user.get("role") not in ("admin",):
        # if client, ensure they own the task
        if task_id:
            task = db.query(Task).filter(Task.id == task_id).first()
            if not task or (task.client_id != user.get("id") and task.assigned_tasker_id != user.get("id")):
                raise permission_error("OFFER_FORBIDDEN", "You cannot view these offers")
    offers = query.order_by(Offer.created_at.desc()).all()
    return [
        OfferOut(
            id=o.id,
            task_id=o.task_id,
            tasker_id=o.tasker_id,
            amount_cents=o.amount,
            currency=o.currency,
            message=o.message,
            status=o.status.value if hasattr(o.status, "value") else o.status,
            created_at=o.created_at,
            updated_at=o.updated_at,
        )
        for o in offers
    ]


@router.post("", response_model=OfferOut)
async def create_offer(payload: OfferCreate, user=Depends(require_roles("tasker", "admin")), db: Session = Depends(get_db)):
    check(user.get("id"), "offer_create", limit=120, window_seconds=600)
    task = db.query(Task).filter(Task.id == payload.task_id).first()
    if not task:
        raise not_found_error("TASK_NOT_FOUND", "Task not found")
    if task.status not in {TaskStatus.open, TaskStatus.assigned}:
        raise conflict_error("TASK_NOT_OPEN", "Task not open for offers")
    offer = Offer(
        id=str(uuid4()),
        task_id=payload.task_id,
        tasker_id=user["id"],
        amount=payload.amount_cents,
        currency=payload.currency,
        message=payload.message,
        status=OfferStatus.pending,
        created_at=datetime.utcnow(),
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)
    send_in_app_notification(user["id"], "offer_created", {"task_id": payload.task_id, "offer_id": offer.id})
    create_notification(db, payload.task_id and task.client_id or user["id"], "offer_created", "New offer", f"New offer on task {payload.task_id}", {"offer_id": offer.id, "task_id": payload.task_id})
    log_event(user_id=user.get("id"), action="offer_created", extra={"offer_id": offer.id, "task_id": payload.task_id})
    return OfferOut(
        id=offer.id,
        task_id=offer.task_id,
        tasker_id=offer.tasker_id,
        amount_cents=offer.amount,
        currency=offer.currency,
        message=offer.message,
        status=offer.status.value,
        created_at=offer.created_at,
        updated_at=offer.updated_at,
    )


@router.post("/{offer_id}/reject")
async def reject_offer(offer_id: str, user=Depends(require_roles("client", "admin")), db: Session = Depends(get_db)):
    offer: Offer | None = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise not_found_error("OFFER_NOT_FOUND", "Offer not found")
    task = db.query(Task).filter(Task.id == offer.task_id).first()
    if user.get("role") != "admin" and task and task.client_id != user.get("id"):
        raise permission_error("OFFER_FORBIDDEN", "Forbidden")
    offer.status = OfferStatus.rejected
    db.commit()
    create_notification(db, offer.tasker_id, "offer_rejected", "Offer rejected", f"Offer on {offer.task_id} rejected", {"offer_id": offer_id, "task_id": offer.task_id})
    log_event(user_id=user.get("id"), action="offer_rejected", extra={"offer_id": offer_id, "task_id": offer.task_id})
    if user.get("role") == "admin":
        log_admin_action(db, user.get("id"), "offer_reject", "offer", offer_id, {"task_id": offer.task_id})
    return {"ok": True, "status": offer.status}


@router.post("/{offer_id}/status")
async def set_offer_status(offer_id: str, status: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    offer: Offer | None = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise not_found_error("OFFER_NOT_FOUND", "Offer not found")
    task = db.query(Task).filter(Task.id == offer.task_id).first()
    if user.get("role") != "admin" and task and task.client_id != user.get("id"):
        raise permission_error("OFFER_FORBIDDEN", "Forbidden")
    if status not in [s.value for s in OfferStatus]:
        raise conflict_error("OFFER_STATUS_INVALID", "Invalid status")
    offer.status = OfferStatus(status)
    offer.updated_at = datetime.utcnow()
    db.commit()
    create_notification(db, offer.tasker_id, "offer_status", "Offer status updated", status, {"offer_id": offer.id, "task_id": offer.task_id})
    log_event(user_id=user.get("id"), action="offer_status_change", extra={"offer_id": offer.id, "status": status})
    if user.get("role") == "admin":
        log_admin_action(db, user.get("id"), "offer_status_change", "offer", offer.id, {"status": status})
    return {"ok": True, "status": offer.status}
