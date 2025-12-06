from taskup_backend.security import create_token
from taskup_backend.models import (
    Wallet,
    TaskStatus,
    OfferStatus,
    PaymentStatus,
    Payment,
    Wallet as WalletModel,
)


def test_full_flow_task_offer_escrow_release(client, session, user_client, user_tasker):
    # Fund client wallet
    wallet: WalletModel | None = session.query(Wallet).filter(Wallet.user_id == user_client.id).first()
    wallet.available_balance = 10000
    session.commit()

    # Client creates task
    headers_client = {"Authorization": f"Bearer {create_token(user_client.id, user_client.email, 'client')}"}
    task_payload = {
        "title": "Assemble furniture",
        "description": "Ikea desk",
        "category": "handyman",
        "location": "Oslo",
        "budget_min": 5000,
        "budget_max": 5000,
        "currency": "NOK",
    }
    t_resp = client.post("/api/tasks", json=task_payload, headers=headers_client)
    assert t_resp.status_code == 200
    task_id = t_resp.json()["id"]

    # Tasker sends offer
    headers_tasker = {"Authorization": f"Bearer {create_token(user_tasker.id, user_tasker.email, 'tasker')}"}
    o_resp = client.post(
        "/api/offers",
        json={"task_id": task_id, "amount_cents": 5000, "currency": "NOK", "message": "Can do today"},
        headers=headers_tasker,
    )
    assert o_resp.status_code == 200
    offer_id = o_resp.json()["id"]

    # Client accepts offer -> escrow hold
    acc_resp = client.post(f"/api/tasks/{task_id}/accept-offer", json={"offer_id": offer_id}, headers=headers_client)
    assert acc_resp.status_code == 200
    session.refresh(wallet)
    assert wallet.escrow_balance == 5000

    payment = session.query(Payment).filter(Payment.offer_id == offer_id).first()
    assert payment is not None
    assert payment.status == PaymentStatus.escrowed

    # Tasker marks done
    md_resp = client.post(f"/api/tasks/{task_id}/mark-done", headers=headers_tasker)
    assert md_resp.status_code == 200

    # Client confirms received -> release escrow
    cr_resp = client.post(f"/api/tasks/{task_id}/confirm-received", headers=headers_client)
    assert cr_resp.status_code == 200
    session.refresh(payment)
    assert payment.status == PaymentStatus.payment_released
    session.refresh(wallet)
    assert wallet.escrow_balance == 0
    tasker_wallet = session.query(Wallet).filter(Wallet.user_id == user_tasker.id).first()
    assert tasker_wallet.available_balance >= 5000


def test_dispute_flow_via_task_endpoint(client, session, user_client, user_tasker):
    headers_client = {"Authorization": f"Bearer {create_token(user_client.id, user_client.email, 'client')}"}
    # create task
    t_resp = client.post(
        "/api/tasks",
        json={"title": "Clean", "description": "Test", "category": "clean", "location": "Oslo", "currency": "NOK"},
        headers=headers_client,
    )
    task_id = t_resp.json()["id"]
    # mark as disputed
    d_resp = client.post(f"/api/tasks/{task_id}/dispute", params={"reason": "not happy"}, headers=headers_client)
    assert d_resp.status_code == 200
    # should reflect status
    g_resp = client.get(f"/api/tasks/{task_id}", headers=headers_client)
    assert g_resp.json()["status"] == TaskStatus.disputed
