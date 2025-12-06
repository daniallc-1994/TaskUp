from fastapi import APIRouter, Depends, Request
from uuid import uuid4
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from ..schemas import TaskOut, TaskCreate, AcceptOffer
from ..security import get_current_user, require_roles
from ..rate_limit import check
from ..database import get_db
from ..models import Task, Offer, TaskStatus, OfferStatus, User
from ..payments_service import hold_escrow_for_offer, release_escrow_to_tasker
from ..notifications import create_notification
from ..errors import TaskUpError, not_found_error, permission_error, conflict_error, auth_error
from ..logging_utils import log_event
from ..admin_logs import log_admin_action
from ..request_context import get_request_context
from ..abuse import ensure_not_blocked, log_device_fingerprint, record_action

router = APIRouter(prefix="/tasks", tags=["tasks"])

ALLOWED_TRANSITIONS = {
    TaskStatus.open: {TaskStatus.assigned, TaskStatus.in_progress, TaskStatus.disputed, TaskStatus.cancelled},
    TaskStatus.assigned: {TaskStatus.in_progress, TaskStatus.disputed, TaskStatus.cancelled},
    TaskStatus.in_progress: {TaskStatus.awaiting_client_confirmation, TaskStatus.disputed},
    TaskStatus.awaiting_client_confirmation: {TaskStatus.completed, TaskStatus.disputed},
    TaskStatus.completed: {TaskStatus.client_confirmed},
    TaskStatus.disputed: {TaskStatus.cancelled, TaskStatus.completed},
}


def _serialize_task(task: Task, include_offers: bool = False) -> TaskOut:
    data = {
        "id": task.id,
        "client_id": task.client_id,
        "assigned_offer_id": task.assigned_offer_id,
        "assigned_tasker_id": task.assigned_tasker_id,
        "title": task.title,
        "description": task.description,
        "category": task.category,
        "location": task.location,
        "latitude": task.latitude,
        "longitude": task.longitude,
        "budget_min": task.budget_min,
        "budget_max": task.budget_max,
        "currency": task.currency,
        "status": task.status.value if hasattr(task.status, "value") else task.status,
        "created_at": task.created_at,
        "due_date": task.due_date,
    }
    if include_offers:
        data["offers"] = getattr(task, "offers", [])
    return TaskOut(**data)


@router.get("", response_model=List[TaskOut])
async def list_tasks(status: Optional[str] = None, category: Optional[str] = None, user=Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Task)
    if status:
        query = query.filter(Task.status == status)
    if category:
        query = query.filter(Task.category == category)
    tasks = query.order_by(Task.created_at.desc()).all()
    return [_serialize_task(t) for t in tasks]


@router.get("/my", response_model=List[TaskOut])
async def my_tasks(user=Depends(get_current_user), db: Session = Depends(get_db)):
    role = user.get("role")
    if role == "tasker":
        tasks = db.query(Task).filter(Task.assigned_tasker_id == user["id"]).all()
    else:
        tasks = db.query(Task).filter(Task.client_id == user["id"]).all()
    return [_serialize_task(t) for t in tasks]


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(task_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    task: Task | None = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise not_found_error("TASK_NOT_FOUND", "Task not found")
    if user.get("role") != "admin" and task.client_id not in (None, user.get("id")) and task.assigned_tasker_id != user.get("id"):
        raise permission_error("TASK_FORBIDDEN", "You cannot access this task")
    include_offers = user.get("role") in ("admin",) or task.client_id == user.get("id")
    return _serialize_task(task, include_offers=include_offers)


@router.post("", response_model=TaskOut)
async def create_task(request: Request, payload: TaskCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    ctx = get_request_context(request, user)
    ensure_not_blocked(ctx, db)
    check(user.get("id"), "task_create", limit=60, window_seconds=300)
    record_action(ctx, "task_create", db, limit=50, window_seconds=300)
    task = Task(
        id=str(uuid4()),
        client_id=user["id"],
        title=payload.title,
        description=payload.description,
        category=payload.category,
        location=payload.location,
        latitude=payload.latitude,
        longitude=payload.longitude,
        budget_min=payload.budget_min,
        budget_max=payload.budget_max,
        currency=payload.currency,
        status=TaskStatus.open,
        created_at=datetime.utcnow(),
        due_date=payload.due_date,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    create_notification(db, task.client_id, "task_created", "Task created", task.title, {"task_id": task.id})
    log_device_fingerprint(ctx, db)
    log_event(user_id=user.get("id"), action="task_created", extra={"task_id": task.id})
    return _serialize_task(task)


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(task_id: str, payload: TaskCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    task: Task | None = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise not_found_error("TASK_NOT_FOUND", "Task not found")
    if user.get("role") != "admin" and task.client_id != user.get("id"):
        raise permission_error("TASK_FORBIDDEN", "You cannot edit this task")
    for field in ["title", "description", "category", "location", "latitude", "longitude", "budget_min", "budget_max", "currency", "due_date"]:
        val = getattr(payload, field, None)
        if val is not None:
            setattr(task, field, val)
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    create_notification(db, task.client_id, "task_updated", "Task updated", task.title, {"task_id": task.id})
    log_event(user_id=user.get("id"), action="task_updated", extra={"task_id": task.id})
    return _serialize_task(task)


@router.post("/{task_id}/status")
async def change_status(task_id: str, status: TaskStatus, user=Depends(get_current_user), db: Session = Depends(get_db)):
    task: Task | None = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise not_found_error("TASK_NOT_FOUND", "Task not found")
    if user.get("role") != "admin" and task.client_id != user.get("id"):
        raise permission_error("TASK_FORBIDDEN", "You cannot change this status")
    current = task.status
    allowed = ALLOWED_TRANSITIONS.get(current, set())
    if status not in allowed:
        raise conflict_error("TASK_STATUS_CONFLICT", f"Invalid transition from {current} to {status}")
    task.status = status
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    create_notification(db, task.client_id, "task_status", f"Status updated to {task.status}", "", {"task_id": task.id, "status": task.status})
    log_event(user_id=user.get("id"), action="task_status_change", extra={"task_id": task.id, "status": str(task.status)})
    if user.get("role") == "admin":
        log_admin_action(db, user.get("id"), "task_status_change", "task", task.id, {"status": str(task.status)})
    return {"ok": True, "status": task.status}


@router.post("/{task_id}/accept-offer")
async def accept_offer(task_id: str, payload: AcceptOffer, user=Depends(require_roles("client", "admin")), db: Session = Depends(get_db)):
    task: Task | None = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise not_found_error("TASK_NOT_FOUND", "Task not found")
    if user.get("role") != "admin" and task.client_id != user.get("id"):
        raise permission_error("TASK_FORBIDDEN", "Only the client can accept offers")

    offer: Offer | None = db.query(Offer).filter(Offer.id == payload.offer_id, Offer.task_id == task_id).first()
    if not offer:
        raise not_found_error("OFFER_NOT_FOUND", "Offer not found")
    # Reject other offers
    db.query(Offer).filter(Offer.task_id == task_id, Offer.id != payload.offer_id).update({"status": OfferStatus.rejected})
    offer.status = OfferStatus.accepted
    task.assigned_offer_id = offer.id
    task.assigned_tasker_id = offer.tasker_id
    task.status = TaskStatus.in_progress
    # Escrow hold
    try:
        hold_escrow_for_offer(db, task.client_id, task, offer)
    except ValueError as e:
        raise conflict_error("PAYMENT_ESCROW_FAILED", str(e))
    db.commit()
    db.refresh(task)
    create_notification(db, offer.tasker_id, "offer_accepted", "Offer accepted", f"Your offer on {task.title} was accepted", {"task_id": task_id, "offer_id": offer.id})
    log_event(user_id=user.get("id"), action="offer_accepted", extra={"task_id": task.id, "offer_id": offer.id})
    log_admin_action(db, user.get("id"), "accept_offer", "task", task.id, {"offer_id": offer.id})
    return {"ok": True, "task_status": task.status}


@router.post("/{task_id}/mark-done")
async def mark_done(task_id: str, user=Depends(require_roles("tasker", "admin")), db: Session = Depends(get_db)):
    task: Task | None = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise not_found_error("TASK_NOT_FOUND", "Task not found")
    if user.get("role") != "admin" and task.assigned_tasker_id != user.get("id"):
        raise permission_error("TASK_FORBIDDEN", "Only assigned tasker can mark done")
    task.status = TaskStatus.awaiting_client_confirmation
    task.updated_at = datetime.utcnow()
    db.commit()
    create_notification(db, task.client_id, "task_marked_done", "Task marked done", "", {"task_id": task_id})
    log_event(user_id=user.get("id"), action="task_marked_done", extra={"task_id": task.id})
    return {"ok": True, "status": task.status}


@router.post("/{task_id}/confirm-received")
async def confirm_received(task_id: str, user=Depends(require_roles("client", "admin")), db: Session = Depends(get_db)):
    task: Task | None = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise not_found_error("TASK_NOT_FOUND", "Task not found")
    if user.get("role") != "admin" and task.client_id != user.get("id"):
        raise permission_error("TASK_FORBIDDEN", "Only the client can confirm delivery")
    if not task.assigned_offer_id or not task.assigned_tasker_id:
        raise conflict_error("TASK_NO_ACCEPTED_OFFER", "No accepted offer to release")
    offer = db.query(Offer).filter(Offer.id == task.assigned_offer_id).first()
    if not offer:
        raise not_found_error("OFFER_NOT_FOUND", "Accepted offer missing")
    try:
        release_escrow_to_tasker(db, task.client_id, task.assigned_tasker_id, task, offer)
    except ValueError as e:
        raise conflict_error("PAYMENT_RELEASE_FAILED", str(e))
    task.status = TaskStatus.completed
    task.updated_at = datetime.utcnow()
    db.commit()
    create_notification(db, task.assigned_tasker_id, "payment_released", "Payment released", "", {"task_id": task_id})
    log_event(user_id=user.get("id"), action="payment_released_task", extra={"task_id": task.id, "offer_id": offer.id})
    return {"ok": True, "status": task.status}


@router.post("/{task_id}/dispute")
async def dispute_task(task_id: str, reason: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    task: Task | None = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise not_found_error("TASK_NOT_FOUND", "Task not found")
    task.status = TaskStatus.disputed
    task.updated_at = datetime.utcnow()
    db.commit()
    create_notification(db, task.client_id, "dispute_opened", "Dispute opened", reason, {"task_id": task_id})
    create_notification(db, task.assigned_tasker_id or task.client_id, "dispute_opened", "Dispute opened", reason, {"task_id": task_id})
    log_event(user_id=user.get("id"), action="dispute_opened", extra={"task_id": task.id})
    if user.get("role") == "admin":
        log_admin_action(db, user.get("id"), "dispute_marked", "task", task.id, {"reason": reason})
    return {"ok": True, "status": task.status}
