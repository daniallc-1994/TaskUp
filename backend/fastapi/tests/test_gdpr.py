import pytest
from taskup_backend.models import Task, Offer, Message, Payment, PaymentStatus, Transaction, TransactionType, Dispute, Notification
from taskup_backend.routers.auth import _user_response
from taskup_backend.security import create_token


def test_account_export_includes_only_user_data(client, session, user_client, user_tasker):
    # create data for both users
    task = Task(id="t1", client_id=user_client.id, title="Task 1", status="open")
    session.add(task)
    offer = Offer(id="o1", task_id=task.id, tasker_id=user_tasker.id, amount=1000, currency="NOK", status="pending")
    session.add(offer)
    msg = Message(id="m1", task_id=task.id, sender_id=user_client.id, receiver_id=user_tasker.id, content="hi")
    session.add(msg)
    pay = Payment(
        id="p1",
        task_id=task.id,
        offer_id=offer.id,
        client_id=user_client.id,
        tasker_id=user_tasker.id,
        wallet_id=f"w-{user_client.id}",
        amount=1000,
        currency="NOK",
        status=PaymentStatus.escrowed,
    )
    session.add(pay)
    tx = Transaction(
        id="tx1",
        wallet_id=f"w-{user_client.id}",
        type=TransactionType.escrow_hold,
        amount=1000,
        currency="NOK",
        status="succeeded",
    )
    session.add(tx)
    disp = Dispute(id="d1", task_id=task.id, raised_by_id=user_client.id, against_user_id=user_tasker.id, reason="test", status="open")
    session.add(disp)
    note = Notification(id="n1", user_id=user_client.id, type="info", title="t", body="b")
    session.add(note)
    session.commit()

    resp = client.get("/api/auth/account/export", headers={"Authorization": f"Bearer {create_token(user_client.id, user_client.email)}"})
    assert resp.status_code == 200
    data = resp.json()
    # user data present
    assert data["user"]["id"] == user_client.id
    assert any(t["id"] == "t1" for t in data["tasks"])
    assert any(m["id"] == "m1" for m in data["messages"])
    assert any(p["id"] == "p1" for p in data["payments"])
    assert any(d["id"] == "d1" for d in data["disputes"])
    assert any(n["id"] == "n1" for n in data["notifications"])
    # offer belongs to tasker; should appear only if tasker exports
    assert len(data["offers"]) == 0


def test_account_delete_anonymises_and_scrubs(client, session, user_client, user_tasker):
    msg = Message(id="m2", task_id="t2", sender_id=user_client.id, receiver_id=user_tasker.id, content="secret")
    session.add(msg)
    session.commit()
    resp = client.post("/api/auth/account/delete", headers={"Authorization": f"Bearer {create_token(user_client.id, user_client.email)}"})
    assert resp.status_code == 200
    # user should be anonymised
    from taskup_backend.models import User

    db_user = session.query(User).filter(User.id == user_client.id).first()
    assert db_user
    assert db_user.flags.get("deleted") is True
    assert db_user.email.startswith("deleted-")
    # message scrubbed
    scrubbed = session.query(Message).filter(Message.id == "m2").first()
    assert scrubbed.content == "[deleted by user]"
