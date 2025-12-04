from fastapi import APIRouter, HTTPException, Depends
from uuid import uuid4
from typing import List
from ..models import Task, TaskCreate, AcceptOffer
from ..security import get_current_user, require_roles
from ..rate_limit import check
from .. import db
import os
import stripe


router = APIRouter(prefix="/tasks", tags=["tasks"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

def _normalize_task(raw: dict) -> dict:
    raw = raw or {}
    if "id" not in raw:
        raw["id"] = str(uuid4())
    return raw


@router.get("", response_model=List[Task])
async def list_tasks(user=Depends(get_current_user)):
    supabase_tasks = db.list_tasks_for_user(user["id"], user.get("role", "client"), jwt=user.get("token"))
    return [Task(**_normalize_task(t)) for t in supabase_tasks]


@router.get("/{task_id}", response_model=Task)
async def get_task(task_id: str, user=Depends(get_current_user)):
    task = db.get_task(task_id, jwt=user.get("token"))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if user.get("role") != "admin" and task.get("client_id") not in (None, user.get("id")) and user.get("role") != "tasker":
        raise HTTPException(status_code=403, detail="Forbidden")
    return Task(**_normalize_task(task))


@router.post("", response_model=Task)
async def create_task(payload: TaskCreate, user=Depends(get_current_user)):
    check(user.get("id"), "task_create", limit=60, window_seconds=300)
    created = db.create_task(
        {
            "client_id": user["id"],
            "title": payload.title,
            "description": payload.description,
            "budget_cents": payload.budget_cents,
            "currency": payload.currency,
            "status": "new",
            "address": payload.address,
            "lat": payload.lat,
            "lng": payload.lng,
            "category": getattr(payload, "category", None),
        },
        jwt=user.get("token"),
    )
    if created:
        return Task(**_normalize_task(created))
    created_mem = Task(
        id=str(uuid4()),
        client_id=user["id"],
        title=payload.title,
        description=payload.description,
        budget_cents=payload.budget_cents,
        currency=payload.currency,
        status="new",
        address=payload.address,
        lat=payload.lat,
        lng=payload.lng,
    )
    return created_mem


@router.post("/{task_id}/accept-offer")
async def accept_offer(task_id: str, payload: AcceptOffer, user=Depends(require_roles("client", "admin"))):
    task = db.get_task(task_id, jwt=user.get("token"))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if user.get("role") != "admin" and task.get("client_id") != user.get("id"):
        raise HTTPException(status_code=403, detail="Only the client can accept offers")

    offer = None
    offers = db.list_offers_for_task(task_id, jwt=user.get("token"))
    for o in offers:
        if o.get("id") == payload.offer_id:
            offer = o
            break
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    db.set_offer_status(payload.offer_id, "accepted", jwt=user.get("token"))
    db.update_task_status(task_id, "offer_accepted", jwt=user.get("token"))

    intent_id = None
    charge_id = None
    if stripe.api_key:
        try:
            intent = stripe.PaymentIntent.create(
                amount=offer.get("amount_cents"),
                currency=offer.get("currency", "nok").lower(),
                automatic_payment_methods={"enabled": True},
                metadata={"task_id": task_id, "offer_id": payload.offer_id, "client_id": user.get("id")},
                confirm=True,
            )
            intent_id = intent["id"]
            charge_id = intent.get("latest_charge")
        except Exception as e:
            print(f"[tasks] accept_offer Stripe error: {e}")

    payment = db.create_payment(
        {
            "task_id": task_id,
            "offer_id": payload.offer_id,
            "amount_cents": offer.get("amount_cents"),
            "currency": offer.get("currency", "NOK"),
            "status": "escrowed",
            "payment_intent_id": intent_id,
            "charge_id": charge_id,
        },
        jwt=user.get("token"),
    )
    return {"ok": True, "payment": payment, "task_status": "offer_accepted"}


@router.post("/{task_id}/mark-done")
async def mark_done(task_id: str, user=Depends(require_roles("tasker", "admin"))):
    task = db.get_task(task_id, jwt=user.get("token"))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    offers = db.list_offers_for_task(task_id, jwt=user.get("token"))
    for o in offers:
        if o.get("tasker_id") == user.get("id"):
            db.set_offer_status(o["id"], "accepted", jwt=user.get("token"))
    db.update_task_status(task_id, "awaiting_client_confirmation", jwt=user.get("token"))
    return {"ok": True, "status": "awaiting_client_confirmation"}


@router.post("/{task_id}/confirm-received")
async def confirm_received(task_id: str, user=Depends(require_roles("client", "admin"))):
    task = db.get_task(task_id, jwt=user.get("token"))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if user.get("role") != "admin" and task.get("client_id") != user.get("id"):
        raise HTTPException(status_code=403, detail="Only the client can confirm delivery")
    db.update_task_status(task_id, "completed", jwt=user.get("token"))
    payments = db.select("payments", {"task_id": task_id}, jwt=user.get("token"))
    transfer_id = None
    if payments:
        payment = payments[0]
        # Attempt Stripe transfer to tasker
        if stripe.api_key and payment.get("amount_cents"):
            try:
                destination = os.getenv("STRIPE_CONNECT_TEST_DESTINATION") or "acct_123"
                transfer = stripe.Transfer.create(
                    amount=payment["amount_cents"],
                    currency=payment.get("currency", "nok").lower(),
                    destination=destination,
                    metadata={"payment_id": payment.get("id"), "task_id": task_id},
                )
                transfer_id = transfer["id"]
            except Exception as e:
                print(f"[tasks] confirm_received transfer error: {e}")
        db.update_payment(payment["id"], {"status": "payment_released", "transfer_id": transfer_id}, jwt=user.get("token"))
    return {"ok": True, "status": "completed", "payment_status": "payment_released", "transfer_id": transfer_id}


@router.post("/{task_id}/dispute")
async def dispute_task(task_id: str, reason: str, user=Depends(get_current_user)):
    task = db.get_task(task_id, jwt=user.get("token"))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    payment = None
    payments = db.select("payments", {"task_id": task_id}, jwt=user.get("token"))
    if payments:
        payment = payments[0]
    db.update_task_status(task_id, "disputed", jwt=user.get("token"))
    dispute = db.open_dispute(
        {
            "task_id": task_id,
            "payment_id": payment.get("id") if payment else None,
            "opened_by": user.get("id"),
            "reason": reason,
            "status": "open",
        },
        jwt=user.get("token"),
    )
    return {"ok": True, "dispute": dispute}
