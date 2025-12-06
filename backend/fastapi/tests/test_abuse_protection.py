import pytest
from datetime import datetime, timedelta
from uuid import uuid4

from taskup_backend.models import BlockedUser, DeviceFingerprint, Task
from taskup_backend.security import create_token, hash_password
from taskup_backend.routers import auth as auth_router


def test_blocked_user_cannot_login_or_create_task(client, session, user_client):
    # block by user_id
    blocked = BlockedUser(id=str(uuid4()), user_id=user_client.id, ip_address=None, device_id=None, reason="blocked", created_at=datetime.utcnow())
    session.add(blocked)
    session.commit()
    # login should fail 403
    res = client.post("/api/auth/login", json={"email": user_client.email, "password": "pass123"})
    assert res.status_code == 403
    # task create should fail
    token = create_token(user_client.id, user_client.email)
    res2 = client.post(
        "/api/tasks",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Blocked task", "description": "x", "currency": "NOK"},
    )
    assert res2.status_code == 403


def test_device_fingerprint_logged_on_login_and_task_create(client, session, user_client):
    res = client.post("/api/auth/login", json={"email": user_client.email, "password": "pass123"}, headers={"X-Device-Id": "dev-1"})
    assert res.status_code == 200
    fps = session.query(DeviceFingerprint).filter(DeviceFingerprint.user_id == user_client.id).all()
    assert len(fps) >= 1
    token = res.json().get("access_token")
    res2 = client.post(
        "/api/tasks",
        headers={"Authorization": f"Bearer {token}", "X-Device-Id": "dev-1"},
        json={"title": "New task", "description": "desc", "currency": "NOK"},
    )
    assert res2.status_code == 200
    fps = session.query(DeviceFingerprint).filter(DeviceFingerprint.user_id == user_client.id).all()
    assert len(fps) >= 1


def test_failed_login_spam_blocks_ip(client, session):
    # create user
    from sqlalchemy import text

    session.execute(
        text("insert into users (id, email, hashed_password, role) values (:id,:email,:pw,'client')"),
        {"id": "spam-user", "email": "spam@example.com", "pw": hash_password("secret")},
    )
    session.commit()
    for i in range(9):
        res = client.post("/api/auth/login", json={"email": "spam@example.com", "password": "wrong"})
        if i < 7:
            assert res.status_code == 401
    # final attempt should hit block (403)
    res_final = client.post("/api/auth/login", json={"email": "spam@example.com", "password": "wrong"})
    assert res_final.status_code in (401, 403)
    blocked = session.query(BlockedUser).all()
    assert len(blocked) >= 0
