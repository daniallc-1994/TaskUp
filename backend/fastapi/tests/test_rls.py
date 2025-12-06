from taskup_backend.security import create_token
from taskup_backend.models import Task, Offer, Message, Payment, PaymentStatus


def test_task_access_denied_for_unrelated_tasker(client, session, user_client, user_tasker):
    task = Task(id="t-rls", client_id=user_client.id, title="Secret", status="open")
    session.add(task)
    session.commit()
    headers_tasker = {"Authorization": f"Bearer {create_token(user_tasker.id, user_tasker.email, 'tasker')}"}
    resp = client.get("/api/tasks/t-rls", headers=headers_tasker)
    assert resp.status_code in (403, 404)


def test_offers_only_visible_to_owner_or_client(client, session, user_client, user_tasker):
    task = Task(id="t-rls-offer", client_id=user_client.id, title="Test", status="open")
    offer = Offer(id="o-rls", task_id=task.id, tasker_id=user_tasker.id, amount=1000, currency="NOK")
    session.add_all([task, offer])
    session.commit()
    # unrelated user
    headers_other = {"Authorization": f"Bearer {create_token('other', 'o@example.com', 'client')}"}
    resp = client.get(f"/api/offers?task_id={task.id}", headers=headers_other)
    assert resp.status_code in (403, 404)
    # owner can see
    headers_client = {"Authorization": f"Bearer {create_token(user_client.id, user_client.email, 'client')}"}
    ok_resp = client.get(f"/api/offers?task_id={task.id}", headers=headers_client)
    assert ok_resp.status_code == 200


def test_messages_forbidden_for_nonparticipants(client, session, user_client, user_tasker):
    msg = Message(id="m-rls", task_id="t-x", sender_id=user_client.id, receiver_id=user_tasker.id, content="hi")
    session.add(msg)
    session.commit()
    headers_other = {"Authorization": f"Bearer {create_token('other', 'o@example.com', 'client')}"}
    resp = client.get("/api/messages?task_id=t-x", headers=headers_other)
    assert resp.status_code in (403, 404)


def test_payments_visibility_limited(client, session, user_client, user_tasker):
    pay = Payment(
        id="p-rls",
        task_id="t-pay",
        offer_id="o-pay",
        client_id=user_client.id,
        tasker_id=user_tasker.id,
        wallet_id=f"w-{user_client.id}",
        amount=1000,
        currency="NOK",
        status=PaymentStatus.escrowed,
    )
    session.add(pay)
    session.commit()
    headers_other = {"Authorization": f"Bearer {create_token('other', 'o@example.com', 'client')}"}
    resp = client.get("/api/payments/transactions", headers=headers_other)
    assert resp.status_code in (200, 401, 403)
    if resp.status_code == 200:
        assert resp.json() == []
