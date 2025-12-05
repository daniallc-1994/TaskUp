from fastapi import APIRouter, Depends
from uuid import uuid4
from typing import List
from datetime import datetime
from sqlalchemy.orm import Session

from ..schemas import DisputeOut, DisputeCreate, DisputeResolve
from ..security import get_current_user, require_roles
from ..database import get_db
from ..models import Dispute, Task, DisputeStatus, Payment, PaymentStatus, TaskStatus, Wallet
from ..payments_service import release_escrow_to_tasker
from ..payments_utils import create_tx
from ..models import TransactionType, TransactionStatus
from ..notifications import create_notification
from ..admin_logs import log_admin_action
from ..errors import not_found_error, permission_error
from ..logging_utils import log_event

router = APIRouter(prefix="/disputes", tags=["disputes"])


@router.get("", response_model=List[DisputeOut])
async def list_disputes(user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.get("role") in ("admin", "support", "moderator"):
        disputes = db.query(Dispute).order_by(Dispute.created_at.desc()).all()
    else:
        disputes = db.query(Dispute).filter(Dispute.raised_by_id == user["id"]).order_by(Dispute.created_at.desc()).all()
    return [DisputeOut.from_orm(d) for d in disputes]


@router.get("/my", response_model=List[DisputeOut])
async def my_disputes(user=Depends(get_current_user), db: Session = Depends(get_db)):
    disputes = db.query(Dispute).filter(Dispute.raised_by_id == user["id"]).order_by(Dispute.created_at.desc()).all()
    return [DisputeOut.from_orm(d) for d in disputes]


@router.post("", response_model=DisputeOut)
async def open_dispute(payload: DisputeCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == payload.task_id).first()
    if not task:
        raise not_found_error("TASK_NOT_FOUND", "Task not found")
    dispute = Dispute(
        id=str(uuid4()),
        task_id=payload.task_id,
        raised_by_id=user["id"],
        against_user_id=payload.against_user_id,
        reason=payload.reason,
        description=payload.description,
        status=DisputeStatus.open,
        created_at=datetime.utcnow(),
    )
    db.add(dispute)
    task.status = TaskStatus.disputed
    db.commit()
    db.refresh(dispute)
    create_notification(db, payload.against_user_id, "dispute_opened", "Dispute opened", payload.reason, {"task_id": payload.task_id})
    log_event(user_id=user.get("id"), action="dispute_opened", extra={"dispute_id": dispute.id, "task_id": payload.task_id})
    return DisputeOut.from_orm(dispute)


@router.post("/{dispute_id}/resolve")
async def resolve_dispute(dispute_id: str, payload: DisputeResolve, user=Depends(require_roles("admin", "support", "moderator")), db: Session = Depends(get_db)):
    dispute: Dispute | None = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise not_found_error("DISPUTE_NOT_FOUND", "Dispute not found")
    task = db.query(Task).filter(Task.id == dispute.task_id).first()
    payment = db.query(Payment).filter(Payment.task_id == dispute.task_id).first()
    if payload.resolution == "release":
        if task and payment:
            # release escrow to tasker
            offer = payment.offer
            release_escrow_to_tasker(db, payment.client_id, payment.tasker_id, task, offer)
        dispute.status = DisputeStatus.resolved_tasker
        if payment:
            payment.status = PaymentStatus.payment_released
    elif payload.resolution == "refund":
        if payment:
            client_wallet: Wallet | None = db.query(Wallet).filter(Wallet.id == payment.wallet_id).first()
            if client_wallet:
                client_wallet.escrow_balance = max(0, client_wallet.escrow_balance - payment.amount)
                client_wallet.available_balance += payment.amount
                create_tx(
                    db,
                    wallet_id=client_wallet.id,
                    type_=TransactionType.refund,
                    amount=payment.amount,
                    currency=payment.currency,
                    status=TransactionStatus.succeeded,
                    meta={"dispute_id": dispute.id, "task_id": dispute.task_id},
                    stripe_ids={"refund": payment.stripe_refund_id},
                )
            payment.status = PaymentStatus.refunded
        dispute.status = DisputeStatus.resolved_client
    else:
        dispute.status = DisputeStatus.partial_refund
        # Split 50/50: half to client (released from escrow), half to tasker
        if payment:
            half = int(payment.amount * 0.5)
            client_wallet: Wallet | None = db.query(Wallet).filter(Wallet.id == payment.wallet_id).first()
            tasker_wallet: Wallet | None = db.query(Wallet).filter(Wallet.user_id == payment.tasker_id).first()
            if client_wallet:
                client_wallet.escrow_balance = max(0, client_wallet.escrow_balance - half)
                client_wallet.available_balance += half
                create_tx(
                    db,
                    wallet_id=client_wallet.id,
                    type_=TransactionType.partial_refund,
                    amount=half,
                    currency=payment.currency,
                    status=TransactionStatus.succeeded,
                    meta={"dispute_id": dispute.id, "task_id": dispute.task_id, "split": "50/50"},
                )
            if tasker_wallet:
                tasker_wallet.available_balance += (payment.amount - half)
                create_tx(
                    db,
                    wallet_id=tasker_wallet.id,
                    type_=TransactionType.release,
                    amount=payment.amount - half,
                    currency=payment.currency,
                    status=TransactionStatus.succeeded,
                    meta={"dispute_id": dispute.id, "task_id": dispute.task_id, "split": "50/50", "to": payment.tasker_id},
                )
            payment.status = PaymentStatus.refunded

    dispute.updated_at = datetime.utcnow()
    db.commit()
    create_notification(db, dispute.raised_by_id, "dispute_resolved", "Dispute resolved", payload.note or "", {"dispute_id": dispute.id})
    create_notification(db, dispute.against_user_id, "dispute_resolved", "Dispute resolved", payload.note or "", {"dispute_id": dispute.id})
    log_event(user_id=user.get("id"), action="dispute_resolved", extra={"dispute_id": dispute.id, "resolution": payload.resolution})
    log_admin_action(db, user.get("id"), "dispute_resolve", "dispute", dispute.id, {"resolution": payload.resolution})
    return {"ok": True, "status": dispute.status}
