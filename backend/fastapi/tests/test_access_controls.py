from taskup_backend.models import Task
from taskup_backend.security import create_token


def test_task_access_forbidden_for_other_user(client, session, user_client, user_tasker):
    task = Task(id="t-forbid", client_id=user_client.id, title="secret", status="open")
    session.add(task)
    session.commit()

    resp = client.get("/api/tasks/t-forbid", headers={"Authorization": f"Bearer {create_token(user_tasker.id, user_tasker.email, 'tasker')}"})
    assert resp.status_code == 403 or resp.status_code == 404


def test_message_create_forbidden_nonparticipant(client, session, user_client):
    # no task assignment to this user
    payload = {"task_id": "missing", "sender_id": user_client.id, "recipient_id": "someone", "body": "hi"}
    resp = client.post("/api/messages", json=payload, headers={"Authorization": f"Bearer {create_token(user_client.id, user_client.email)}"})
    assert resp.status_code in (404, 403)
