from fastapi import APIRouter, HTTPException, Depends, Request
from uuid import uuid4
from typing import List
from ..models import Payment, PaymentCreate
from ..security import get_current_user, require_roles
from .. import db
import stripe
import os


router = APIRouter(prefix="/payments", tags=["payments"])

_payments: List[Payment] = []
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


def _normalize(raw: dict) -> dict:
    raw = raw or {}
    if "id" not in raw:
        raw["id"] = str(uuid4())
    return raw


def _transfer_destination_for_task(task_id: str) -> str:
    # Placeholder: pull tasker's Stripe connect account from profile; fallback env for now.
    return os.getenv("STRIPE_CONNECT_TEST_DESTINATION") or "acct_123"


@router.get("", response_model=List[Payment])
async def list_payments(user=Depends(get_current_user)):
    data = db.select("payments", {}, jwt=user.get("token"))
    return [Payment(**_normalize(p)) for p in data]


@router.post("", response_model=Payment)
async def create_payment(payload: PaymentCreate, user=Depends(get_current_user)):
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

    supa = db.create_payment(
        {
            "task_id": payload.task_id,
            "offer_id": payload.offer_id,
            "status": "escrowed",
            "amount_cents": payload.amount_cents,
            "currency": payload.currency,
            "payment_intent_id": intent_id,
            "charge_id": charge_id,
        },
        jwt=user.get("token"),
    )
    if supa:
        return Payment(**_normalize(supa))

    created = Payment(
        id=str(uuid4()),
        task_id=payload.task_id,
        offer_id=payload.offer_id,
        status="escrowed",
        amount_cents=payload.amount_cents,
        currency=payload.currency,
        payment_intent_id=intent_id,
        charge_id=charge_id,
    )
    _payments.append(created)
    return created


@router.post("/{payment_id}/release")
async def release_payment(payment_id: str, user=Depends(require_roles("admin", "client"))):
    payment = db.get_payment(payment_id, jwt=user.get("token"))
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    transfer_id = None
    if stripe.api_key and payment.get("amount_cents"):
        try:
            transfer = stripe.Transfer.create(
                amount=payment["amount_cents"],
                currency=payment.get("currency", "nok").lower(),
                destination=_transfer_destination_for_task(payment.get("task_id")),
                metadata={"payment_id": payment_id, "task_id": payment.get("task_id")},
            )
            transfer_id = transfer["id"]
        except Exception as e:
            print(f"[payments] Stripe transfer error: {e}")
    updated = db.update_payment(payment_id, {"status": "payment_released", "transfer_id": transfer_id}, jwt=user.get("token"))
    if updated:
        return {"ok": True, "payment": updated}
    for idx, p in enumerate(_payments):
        if p.id == payment_id:
            _payments[idx] = p.copy(update={"status": "payment_released", "transfer_id": transfer_id})
            return {"ok": True, "payment": _payments[idx]}
    raise HTTPException(status_code=404, detail="Payment not found")


@router.post("/{payment_id}/refund")
async def refund_payment(payment_id: str, user=Depends(require_roles("admin", "support", "client"))):
    payment = db.get_payment(payment_id, jwt=user.get("token"))
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    refund_id = None
    if stripe.api_key and payment.get("payment_intent_id"):
        try:
            refund = stripe.Refund.create(payment_intent=payment["payment_intent_id"])
            refund_id = refund["id"]
        except Exception as e:
            print(f"[payments] Stripe refund error: {e}")
    updated = db.update_payment(payment_id, {"status": "refunded", "refund_id": refund_id}, jwt=user.get("token"))
    if updated:
        return {"ok": True, "payment": updated}
    for idx, p in enumerate(_payments):
        if p.id == payment_id:
            _payments[idx] = p.copy(update={"status": "refunded", "refund_id": refund_id})
            return {"ok": True, "payment": _payments[idx]}
    raise HTTPException(status_code=404, detail="Payment not found")


@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    event = None
    if stripe.api_key and webhook_secret:
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)  # type: ignore
        except Exception as e:
            print(f"[payments] webhook error: {e}")
    else:
        return {"received": True}

    if not event:
        return {"received": False}

    data = event["data"]["object"]
    intent_id = data.get("id") or data.get("payment_intent")
    if not intent_id:
        return {"received": True}

    payments = db.select("payments", {"payment_intent_id": intent_id})
    if payments:
        payment = payments[0]
        status = payment.get("status")
        update_payload = {}
        if event["type"] == "payment_intent.succeeded":
            status = "escrowed"
            update_payload["charge_id"] = data.get("latest_charge") or payment.get("charge_id")
        elif event["type"] == "payment_intent.payment_failed":
            status = "failed"
        elif event["type"] == "charge.refunded":
            status = "refunded"
            update_payload["refund_id"] = data.get("id")
        elif event["type"] == "charge.dispute.created":
            status = "disputed"
        elif event["type"] == "transfer.created":
            status = "payment_released"
            update_payload["transfer_id"] = data.get("id")
        if status:
            update_payload["status"] = status
            db.update_payment(payment["id"], update_payload)
    return {"received": True}
