import json
from taskup_backend.models import (
    Task,
    Offer,
    Wallet,
    Payment,
    PaymentStatus,
    TaskStatus,
    OfferStatus,
    Transaction,
    TransactionType,
    TransactionStatus,
    Dispute,
    DisputeStatus,
    Notification,
)
from taskup_backend.security import create_token


def _seed_payment(session, client_id: str, tasker_id: str):
    task = Task(id="t-stripe", client_id=client_id, title="Stripe Task", status=TaskStatus.in_progress)
    offer = Offer(id="o-stripe", task_id=task.id, tasker_id=tasker_id, amount=5000, currency="NOK", status=OfferStatus.accepted)
    wallet = session.query(Wallet).filter(Wallet.user_id == client_id).first()
    if wallet:
        wallet.available_balance = max(wallet.available_balance, 10000)
    else:
        wallet = Wallet(id=f"w-{client_id}", user_id=client_id, available_balance=10000, escrow_balance=0, currency="NOK")
    payment = Payment(
        id="p-stripe",
        task_id=task.id,
        offer_id=offer.id,
        client_id=client_id,
        tasker_id=tasker_id,
        wallet_id=wallet.id,
        amount=5000,
        currency="NOK",
        status=PaymentStatus.escrowed,
        stripe_charge_id="ch_test",
        stripe_payment_intent_id="pi_test",
    )
    session.add_all([task, offer, wallet, payment])
    session.commit()
    return payment


def test_dispute_created_creates_dispute_and_notifications(client, session, user_client, user_tasker):
    payment = _seed_payment(session, user_client.id, user_tasker.id)
    payload = {
        "type": "charge.dispute.created",
        "data": {"object": {"id": "dp_test", "charge": payment.stripe_charge_id, "payment_intent": payment.stripe_payment_intent_id}},
    }
    resp = client.post("/api/payments/webhooks/stripe", data=json.dumps(payload))
    assert resp.status_code == 200
    refreshed = session.query(Payment).filter(Payment.id == payment.id).first()
    assert refreshed.status == PaymentStatus.disputed
    dispute = session.query(Dispute).filter(Dispute.task_id == payment.task_id).first()
    assert dispute is not None
    assert dispute.status == DisputeStatus.open
    notes = session.query(Notification).all()
    assert len(notes) >= 2  # client + tasker


def test_dispute_closed_updates_status_and_payment(client, session, user_client, user_tasker):
    payment = _seed_payment(session, user_client.id, user_tasker.id)
    dispute = Dispute(
        id="dp-close",
        task_id=payment.task_id,
        raised_by_id=user_client.id,
        against_user_id=user_tasker.id,
        reason="stripe_dispute",
        status=DisputeStatus.open,
    )
    session.add(dispute)
    session.commit()
    payload = {
        "type": "charge.dispute.closed",
        "data": {"object": {"id": "dp-close", "charge": payment.stripe_charge_id, "payment_intent": payment.stripe_payment_intent_id, "status": "won"}},
    }
    resp = client.post("/api/payments/webhooks/stripe", data=json.dumps(payload))
    assert resp.status_code == 200
    dispute_ref = session.query(Dispute).filter(Dispute.id == "dp-close").first()
    pay_ref = session.query(Payment).filter(Payment.id == payment.id).first()
    assert dispute_ref.status == DisputeStatus.resolved_tasker
    assert pay_ref.status == PaymentStatus.payment_released


def test_transfer_failed_marks_payment_failed(client, session, user_client, user_tasker):
    payment = _seed_payment(session, user_client.id, user_tasker.id)
    payment.status = PaymentStatus.payment_released
    payment.stripe_transfer_id = "tr_123"
    session.commit()
    payload = {"type": "transfer.failed", "data": {"object": {"id": "tr_123"}}}
    client.post("/api/payments/webhooks/stripe", data=json.dumps(payload))
    pay_ref = session.query(Payment).filter(Payment.id == payment.id).first()
    assert pay_ref.status == PaymentStatus.failed


def test_payout_paid_updates_transaction(client, session, user_tasker):
    wallet = session.query(Wallet).filter(Wallet.user_id == user_tasker.id).first()
    if not wallet:
        wallet = Wallet(id=f"w-{user_tasker.id}", user_id=user_tasker.id, available_balance=0, escrow_balance=0, currency="NOK")
    tx = Transaction(
        id="tx-po",
        wallet_id=wallet.id,
        type=TransactionType.payout,
        amount=1000,
        currency="NOK",
        status=TransactionStatus.pending,
        stripe_payout_id="po_123",
    )
    session.add_all([wallet, tx])
    session.commit()
    payload = {"type": "payout.paid", "data": {"object": {"id": "po_123"}}}
    client.post("/api/payments/webhooks/stripe", data=json.dumps(payload))
    tx_ref = session.query(Transaction).filter(Transaction.id == "tx-po").first()
    assert tx_ref.status == TransactionStatus.succeeded


def test_payment_intent_idempotent(client, session, user_client, user_tasker):
    payment = _seed_payment(session, user_client.id, user_tasker.id)
    payload = {"type": "payment_intent.succeeded", "data": {"object": {"id": payment.stripe_payment_intent_id, "latest_charge": "ch_new"}}}
    for _ in range(2):
        client.post("/api/payments/webhooks/stripe", data=json.dumps(payload))
    payments = session.query(Payment).filter(Payment.stripe_payment_intent_id == payment.stripe_payment_intent_id).all()
    assert len(payments) == 1
