from fastapi import APIRouter, Depends, Request
from uuid import uuid4
from typing import List
from datetime import datetime
from ..schemas import PaymentOut, PaymentCreate, WalletOut, TransactionOut
from ..security import get_current_user, require_roles
from ..database import get_db
from ..models import Wallet, Transaction, TransactionType, TransactionStatus, Payment, PaymentStatus, Offer, User, Task
from ..notifications import create_notification
from ..admin_logs import log_admin_action
from ..payments_service import _get_wallet, release_escrow_to_tasker
from ..payments_utils import create_tx
from ..logging_utils import log_event
from ..metrics import record_metric
from sqlalchemy.orm import Session
import stripe
import os
from ..errors import not_found_error, conflict_error, internal_error

router = APIRouter(prefix="/payments", tags=["payments"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


def _transfer_destination_for_user(db: Session, tasker_id: str | None) -> str | None:
    if not tasker_id:
        return None
    user = db.query(User).filter(User.id == tasker_id).first()
    return user and user.stripe_connect_account_id


@router.get("/wallet", response_model=WalletOut)
async def get_wallet(user=Depends(get_current_user), db: Session = Depends(get_db)):
    wallet = db.query(Wallet).filter(Wallet.user_id == user["id"]).first()
    if not wallet:
        wallet = Wallet(id=user["id"], user_id=user["id"], available_balance=0, escrow_balance=0, currency="NOK")
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    log_event(user_id=user.get("id"), action="wallet_view", extra={"wallet_id": wallet.id})
    return WalletOut.from_orm(wallet)


@router.get("/transactions", response_model=List[TransactionOut])
async def list_transactions(user=Depends(get_current_user), db: Session = Depends(get_db)):
    wallet = db.query(Wallet).filter(Wallet.user_id == user["id"]).first()
    if not wallet:
        return []
    txs = db.query(Transaction).filter(Transaction.wallet_id == wallet.id).order_by(Transaction.created_at.desc()).all()
    log_event(user_id=user.get("id"), action="transactions_list", extra={"wallet_id": wallet.id, "count": len(txs)})
    record_metric("transactions.list", len(txs), wallet_id=wallet.id)
    return [
        TransactionOut(
            id=t.id,
            wallet_id=t.wallet_id,
            type=t.type.value if hasattr(t.type, "value") else t.type,
            amount=t.amount,
            currency=t.currency,
            stripe_payment_intent_id=t.stripe_payment_intent_id,
            stripe_payout_id=t.stripe_payout_id,
            stripe_transfer_id=t.stripe_transfer_id,
            status=t.status.value if hasattr(t.status, "value") else t.status,
            meta=t.meta,
            created_at=t.created_at,
        )
        for t in txs
    ]


@router.post("/topup-intent")
async def topup_intent(user=Depends(get_current_user)):
    if not stripe.api_key:
        raise internal_error("Stripe not configured")
    intent = stripe.PaymentIntent.create(
        amount=0,  # client will specify on client side; can be overridden via metadata
        currency="nok",
        automatic_payment_methods={"enabled": True},
        metadata={"user_id": user.get("id")},
    )
    log_event(user_id=user.get("id"), action="topup_intent", extra={"payment_intent_id": intent["id"]})
    record_metric("topup.intent", 1, user_id=user.get("id"))
    return {"client_secret": intent["client_secret"], "payment_intent_id": intent["id"]}


@router.post("", response_model=PaymentOut)
async def create_payment(payload: PaymentCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    # create a payment directly (rare path; prefer escrow via offers)
    offer = db.query(Offer).filter(Offer.id == payload.offer_id, Offer.task_id == payload.task_id).first()
    if not offer:
        raise not_found_error("OFFER_NOT_FOUND", "Offer not found for payment")
    task = db.query(Task).filter(Task.id == payload.task_id).first()
    if not task:
        raise not_found_error("TASK_NOT_FOUND", "Task not found")
    tasker_id = offer.tasker_id
    if not tasker_id:
        raise conflict_error("PAYMENT_TASKER_MISSING", "Offer has no tasker assigned")

    intent_id = None
    charge_id = None
    try:
        if stripe.api_key:
            intent = stripe.PaymentIntent.create(
                amount=payload.amount_cents,
                currency=payload.currency.lower(),
                automatic_payment_methods={"enabled": True},
                metadata={"task_id": payload.task_id, "offer_id": payload.offer_id, "initiator": user.get("id")},
                confirm=True,
            )
            intent_id = intent["id"]
            charge_id = intent.get("latest_charge")
    except Exception as e:
        print(f"[payments] Stripe intent error: {e}")

    wallet = _get_wallet(db, user["id"])
    payment = Payment(
        id=str(uuid4()),
        task_id=payload.task_id,
        offer_id=payload.offer_id,
        client_id=user["id"],
        tasker_id=tasker_id,
        wallet_id=wallet.id,
        amount=payload.amount_cents,
        currency=payload.currency,
        status=PaymentStatus.escrowed,
        stripe_payment_intent_id=intent_id,
        stripe_charge_id=charge_id,
        created_at=datetime.utcnow(),
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    create_notification(db, user["id"], "payment_created", "Payment initiated", "", {"payment_id": payment.id, "task_id": task.id})
    log_event(user_id=user.get("id"), action="payment_created", extra={"payment_id": payment.id, "amount": payload.amount_cents})
    record_metric("payment.created", payload.amount_cents, user_id=user.get("id"), currency=payload.currency)
    return PaymentOut.from_orm(payment)


@router.post("/{payment_id}/release")
async def release_payment(payment_id: str, user=Depends(require_roles("admin", "client")), db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise not_found_error("PAYMENT_NOT_FOUND", "Payment not found")
    task = db.query(Task).filter(Task.id == payment.task_id).first()
    offer = db.query(Offer).filter(Offer.id == payment.offer_id).first()
    if not task or not offer:
        raise not_found_error("TASK_OR_OFFER_MISSING", "Task or offer missing for release")
    try:
        release_escrow_to_tasker(db, payment.client_id, offer.tasker_id, task, offer)
    except Exception as e:
        raise conflict_error("PAYMENT_RELEASE_FAILED", str(e))
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    log_admin_action(db, user.get("id"), "release_payment", "payment", payment_id, {"task_id": payment.task_id, "offer_id": payment.offer_id})
    log_event(user_id=user.get("id"), action="payment_released", extra={"payment_id": payment.id})
    record_metric("payment.released", payment.amount, payment_id=payment.id)
    create_notification(db, payment.tasker_id, "payment_released", "Payment released", "", {"payment_id": payment.id, "task_id": payment.task_id})
    return {"ok": True, "payment": PaymentOut.from_orm(payment)}


@router.post("/{payment_id}/refund")
async def refund_payment(payment_id: str, user=Depends(require_roles("admin", "support", "client")), db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise not_found_error("PAYMENT_NOT_FOUND", "Payment not found")
    wallet = db.query(Wallet).filter(Wallet.id == payment.wallet_id).first()
    if not wallet:
        raise conflict_error("WALLET_NOT_FOUND", "Wallet missing for payment")
    refund_id = None
    if stripe.api_key and payment.stripe_payment_intent_id:
        try:
            refund = stripe.Refund.create(payment_intent=payment.stripe_payment_intent_id)
            refund_id = refund["id"]
        except Exception as e:
            print(f"[payments] Stripe refund error: {e}")
    # move funds back to available if still in escrow
    wallet.escrow_balance = max(0, wallet.escrow_balance - payment.amount)
    wallet.available_balance += payment.amount
    payment.status = PaymentStatus.refunded
    payment.stripe_refund_id = refund_id
    payment.updated_at = datetime.utcnow()
    create_tx(
        db,
        wallet_id=wallet.id,
        type_=TransactionType.refund,
        amount=payment.amount,
        currency=payment.currency,
        status=TransactionStatus.succeeded,
        meta={"payment_id": payment.id, "task_id": payment.task_id},
        stripe_ids={"refund": refund_id},
    )
    db.commit()
    db.refresh(payment)
    create_notification(db, payment.client_id, "payment_refunded", "Payment refunded", "", {"payment_id": payment.id})
    log_admin_action(db, user.get("id"), "refund_payment", "payment", payment_id, {"refund_id": refund_id})
    log_event(user_id=user.get("id"), action="payment_refunded", extra={"payment_id": payment.id, "refund_id": refund_id})
    record_metric("payment.refunded", payment.amount, payment_id=payment.id)
    return {"ok": True, "payment": PaymentOut.from_orm(payment)}


@router.post("/payout-request")
async def payout_request(amount_cents: int, user=Depends(require_roles("tasker", "admin")), db: Session = Depends(get_db)):
    wallet = db.query(Wallet).filter(Wallet.user_id == user["id"]).first()
    if not wallet or wallet.available_balance < amount_cents:
        raise conflict_error("PAYOUT_INSUFFICIENT_BALANCE", "Insufficient available balance")
    db_user = db.query(User).filter(User.id == user["id"]).first()
    destination = _transfer_destination_for_user(db, user["id"])
    if not destination:
        raise conflict_error("PAYOUT_DESTINATION_MISSING", "Stripe Connect account not linked")
    wallet.available_balance -= amount_cents
    tx = Transaction(
        id=str(uuid4()),
        wallet_id=wallet.id,
        type=TransactionType.payout,
        amount=amount_cents,
        currency=wallet.currency,
        status=TransactionStatus.pending,
        created_at=datetime.utcnow(),
    )
    db.add(tx)
    payout_id = None
    if stripe.api_key and destination:
        try:
            payout = stripe.Payout.create(
                amount=amount_cents,
                currency=wallet.currency.lower(),
                metadata={"wallet_id": wallet.id, "user_id": user["id"], "tx_id": tx.id},
                stripe_account=destination,
            )
            payout_id = payout["id"]
            tx.stripe_payout_id = payout_id
            tx.status = TransactionStatus.succeeded
        except Exception as e:
            # keep pending so admin can review
            tx.status = TransactionStatus.pending
            print(f"[payments] payout error: {e}")
    db.commit()
    create_notification(db, user["id"], "payout_requested", "Payout requested", "", {"amount_cents": amount_cents})
    log_admin_action(db, user.get("id"), "payout_request", "wallet", wallet.id, {"amount_cents": amount_cents})
    log_event(user_id=user.get("id"), action="payout_request", extra={"wallet_id": wallet.id, "amount_cents": amount_cents})
    record_metric("payout.request", amount_cents, wallet_id=wallet.id)
    return {"ok": True, "payout_status": tx.status, "payout_id": payout_id}


@router.post("/connect/account-link")
async def create_connect_account_link(user=Depends(require_roles("tasker", "admin")), db: Session = Depends(get_db)):
    """
    Create or fetch a Stripe Connect account for the tasker and return an onboarding link.
    """
    if not stripe.api_key:
        raise internal_error("Stripe not configured")
    db_user: User | None = db.query(User).filter(User.id == user["id"]).first()
    if not db_user:
        raise not_found_error("USER_NOT_FOUND", "User not found")
    account_id = db_user.stripe_connect_account_id
    if not account_id:
        acct = stripe.Account.create(type="express", email=db_user.email, metadata={"user_id": db_user.id})
        account_id = acct["id"]
        db_user.stripe_connect_account_id = account_id
        db.commit()
    link = stripe.AccountLink.create(
        account=account_id,
        refresh_url=os.getenv("STRIPE_CONNECT_REFRESH_URL", "https://taskup.no/connect/refresh"),
        return_url=os.getenv("STRIPE_CONNECT_RETURN_URL", "https://taskup.no/connect/return"),
        type="account_onboarding",
    )
    log_event(user_id=user.get("id"), action="connect_account_link", extra={"account_id": account_id})
    record_metric("connect.account_link", 1, user_id=user.get("id"))
    return {"url": link["url"], "account_id": account_id}


@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    event = None
    if stripe.api_key and webhook_secret:
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)  # type: ignore
        except Exception as e:
            print(f"[payments] webhook error: {e}")
            return {"received": False}
    else:
        return {"received": True}

    data = event["data"]["object"]
    event_type = event.get("type")
    intent_id = data.get("id") or data.get("payment_intent")
    metadata = data.get("metadata", {}) if isinstance(data, dict) else {}
    payment: Payment | None = None
    if intent_id:
        payment = db.query(Payment).filter(Payment.stripe_payment_intent_id == intent_id).first()
        # Create payment record if missing but metadata present
        if not payment and metadata.get("task_id") and metadata.get("offer_id") and metadata.get("initiator"):
            offer = db.query(Offer).filter(Offer.id == metadata.get("offer_id")).first()
            tasker_id = offer.tasker_id if offer else None
            wallet = _get_wallet(db, metadata.get("initiator"))
            payment = Payment(
                id=str(uuid4()),
                task_id=metadata.get("task_id"),
                offer_id=metadata.get("offer_id"),
                client_id=metadata.get("initiator"),
                tasker_id=tasker_id or "",
                wallet_id=wallet.id,
                amount=data.get("amount_received") or data.get("amount") or 0,
                currency=data.get("currency", "nok").upper(),
                status=PaymentStatus.escrowed,
                stripe_payment_intent_id=intent_id,
                stripe_charge_id=data.get("latest_charge"),
                created_at=datetime.utcnow(),
            )
            db.add(payment)
            db.commit()
            db.refresh(payment)
            create_notification(db, payment.client_id, "payment_created", "Payment captured", "", {"payment_id": payment.id})

    if payment:
        if event_type == "payment_intent.succeeded":
            payment.status = PaymentStatus.escrowed
            payment.stripe_charge_id = data.get("latest_charge") or payment.stripe_charge_id
        elif event_type == "payment_intent.payment_failed":
            payment.status = PaymentStatus.failed
        elif event_type == "charge.refunded":
            payment.status = PaymentStatus.refunded
            payment.stripe_refund_id = data.get("id")
        elif event_type == "charge.dispute.created":
            payment.status = PaymentStatus.disputed
            notify_admins(db, "payment_dispute", "Stripe dispute opened", "", {"payment_id": payment.id})
        elif event_type == "charge.dispute.closed":
            payment.status = PaymentStatus.escrowed
        elif event_type == "transfer.created":
            payment.status = PaymentStatus.payment_released
            payment.stripe_transfer_id = data.get("id")
        elif event_type == "transfer.failed":
            notify_admins(db, "payment_transfer_failed", "Stripe transfer failed", "", {"payment_id": payment.id})
        elif event_type == "payout.created":
            # Update related transaction if exists
            tx = db.query(Transaction).filter(Transaction.stripe_payout_id == data.get("id")).first()
            if tx:
                tx.status = TransactionStatus.succeeded
        elif event_type in ("payout.failed", "payout.canceled"):
            tx = db.query(Transaction).filter(Transaction.stripe_payout_id == data.get("id")).first()
            if tx:
                tx.status = TransactionStatus.failed
            notify_admins(db, "payout_failed", "Payout failed", "", {"payout_id": data.get("id")})
        payment.updated_at = datetime.utcnow()
        db.commit()
    log_event(user_id=None, action="stripe_webhook", extra={"type": event_type, "intent": intent_id})
    return {"received": True}
