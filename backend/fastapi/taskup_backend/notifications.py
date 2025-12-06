from datetime import datetime
from uuid import uuid4
from typing import Any, Optional
from sqlalchemy.orm import Session
import os
import requests
import logging

from .models import Notification, User

logger = logging.getLogger("taskup")


def send_push_notification(user_id: str, title: str, body: str, data: dict | None = None) -> bool:
    expo_url = os.getenv("EXPO_PUSH_API_URL")
    token = os.getenv("EXPO_PUSH_TOKEN")  # For production, store per-user tokens in DB.
    if not expo_url or not token:
        return False
    try:
        requests.post(
            expo_url,
            json={"to": token, "sound": "default", "title": title, "body": body, "data": data or {}},
            timeout=5,
        )
        return True
    except Exception as e:
        logger.warning(f"push_failed user={user_id} err={e}")
        return False


def send_email_notification(to_email: str, subject: str, content: str, data: dict | None = None) -> bool:
    provider_key = os.getenv("EMAIL_PROVIDER_API_KEY")
    provider_url = os.getenv("EMAIL_PROVIDER_API_URL")
    if not provider_key or not provider_url:
        return False
    try:
        requests.post(
            provider_url,
            headers={"Authorization": f"Bearer {provider_key}", "Content-Type": "application/json"},
            json={"to": to_email, "subject": subject, "content": content, "data": data or {}},
            timeout=5,
        )
        return True
    except Exception as e:
        logger.warning(f"email_failed to={to_email} err={e}")
        return False


def send_in_app_notification(user_id: str, type_: str, data: Optional[Any] = None) -> bool:
    """
    Backwards-compatible helper for legacy in-app notification calls.
    Delegates to push notifications with a minimal payload.
    """
    return send_push_notification(user_id, type_, type_, data or {})


def create_notification(db: Session, user_id: str, type_: str, title: str, body: str, data: Optional[Any] = None):
    note = Notification(
        id=str(uuid4()),
        user_id=user_id,
        type=type_,
        title=title,
        body=body,
        data=data or {},
        created_at=datetime.utcnow(),
        is_read=False,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    send_push_notification(user_id, title, body, data or {})
    return note


def notify_admins(db: Session, type_: str, title: str, body: str, data: Optional[Any] = None):
    admins = db.query(User).filter(User.role == "admin").all()
    for adm in admins:
        create_notification(db, adm.id, type_, title, body, data or {})
