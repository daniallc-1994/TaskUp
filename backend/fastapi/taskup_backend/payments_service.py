from datetime import datetime
from typing import Optional
from uuid import uuid4
from sqlalchemy.orm import Session

from .models import Wallet, Transaction, TransactionType, TransactionStatus, Offer, Task, Payment, PaymentStatus, User
from .notifications import create_notification
from .admin_logs import log_admin_action
from .payments_utils import ensure_wallet, create_tx
import stripe
import os
from .errors import conflict_error, internal_error

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


def _get_wallet(db: Session, user_id: str) -> Wallet:
    return ensure_wallet(db, user_id)


def hold_escrow_for_offer(db: Session, client_user_id: str, task: Task, offer: Offer, intent_id: Optional[str] = None, charge_id: Optional[str] = None):
    client_wallet = _get_wallet(db, client_user_id)
    if client_wallet.available_balance < offer.amount:
        raise ValueError("Insufficient balance for escrow")

    client_wallet.available_balance -= offer.amount
    client_wallet.escrow_balance += offer.amount

    tx = create_tx(
        db,
        wallet_id=client_wallet.id,
        type_=TransactionType.escrow_hold,
        amount=offer.amount,
        currency=offer.currency,
        status=TransactionStatus.succeeded,
        meta={"task_id": task.id, "offer_id": offer.id},
        stripe_ids={"payment_intent": intent_id, "transfer": None, "refund": None, "payout": None},
    )
    payment = Payment(
        id=str(uuid4()),
        task_id=task.id,
        offer_id=offer.id,
        client_id=client_user_id,
        tasker_id=offer.tasker_id,
        wallet_id=client_wallet.id,
        amount=offer.amount,
        currency=offer.currency,
        status=PaymentStatus.escrowed,
        stripe_payment_intent_id=intent_id,
        stripe_charge_id=charge_id,
        created_at=datetime.utcnow(),
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    create_notification(db, client_user_id, "payment_escrowed", "Payment escrowed", "", {"task_id": task.id, "offer_id": offer.id, "payment_id": payment.id})
    log_admin_action(db, client_user_id, "escrow_hold", "payment", payment.id, {"task_id": task.id, "offer_id": offer.id})
    db.refresh(client_wallet)
    return tx, payment


def release_escrow_to_tasker(db: Session, client_user_id: str, tasker_user_id: str, task: Task, offer: Offer):
    client_wallet = _get_wallet(db, client_user_id)
    tasker_wallet = _get_wallet(db, tasker_user_id)

    if client_wallet.escrow_balance < offer.amount:
        raise ValueError("Escrow balance insufficient")

    client_wallet.escrow_balance -= offer.amount
    tasker_wallet.available_balance += offer.amount

    tx_release = create_tx(
        db,
        wallet_id=client_wallet.id,
        type_=TransactionType.release,
        amount=offer.amount,
        currency=offer.currency,
        status=TransactionStatus.succeeded,
        meta={"task_id": task.id, "offer_id": offer.id, "to": tasker_user_id},
    )
    # Mirror credit transaction for tasker wallet
    create_tx(
        db,
        wallet_id=tasker_wallet.id,
        type_=TransactionType.release,
        amount=offer.amount,
        currency=offer.currency,
        status=TransactionStatus.succeeded,
        meta={"task_id": task.id, "offer_id": offer.id, "from": client_user_id},
    )

    payment: Payment | None = db.query(Payment).filter(Payment.offer_id == offer.id, Payment.task_id == task.id).first()
    if payment:
        destination = None
        tasker: User | None = db.query(User).filter(User.id == tasker_user_id).first()
        if tasker and tasker.stripe_connect_account_id:
            destination = tasker.stripe_connect_account_id
        transfer_id = None
        if stripe.api_key and destination:
            try:
                transfer = stripe.Transfer.create(
                    amount=offer.amount,
                    currency=offer.currency.lower(),
                    destination=destination,
                    metadata={"payment_id": payment.id, "task_id": task.id, "tasker_id": tasker_user_id},
                )
                transfer_id = transfer["id"]
            except Exception as e:
                raise internal_error("PAYMENT_TRANSFER_FAILED", f"Stripe transfer failed: {e}")
        payment.status = PaymentStatus.payment_released
        payment.stripe_transfer_id = transfer_id
        payment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(client_wallet)
    db.refresh(tasker_wallet)
    create_notification(db, tasker_user_id, "payment_released", "Payment released", "", {"task_id": task.id, "offer_id": offer.id, "payment_id": payment.id if payment else None})
    log_admin_action(db, client_user_id, "escrow_release", "payment", payment.id if payment else None, {"task_id": task.id, "offer_id": offer.id})
    return tx_release
