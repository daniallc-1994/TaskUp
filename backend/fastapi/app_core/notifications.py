import os
from typing import Dict, Any, List
import httpx
from . import db

EXPO_PUSH_API_URL = os.getenv("EXPO_PUSH_API_URL")
EMAIL_PROVIDER_API_KEY = os.getenv("EMAIL_PROVIDER_API_KEY")


def send_push(device_tokens: List[str], title: str, body: str, data: Dict[str, Any] | None = None):
    if not EXPO_PUSH_API_URL or not device_tokens:
        return {"sent": 0}
    sent = 0
    for token in device_tokens:
        payload = {"to": token, "title": title, "body": body, "data": data or {}}
        try:
            httpx.post(EXPO_PUSH_API_URL, json=payload, timeout=5.0)
            sent += 1
        except Exception as e:
            print(f"[notify] push error: {e}")
    return {"sent": sent}


def send_email(to_email: str, subject: str, body: str):
    if not to_email:
        return {"sent": 0}
    if not EMAIL_PROVIDER_API_KEY:
        print(f"[notify] email stub to {to_email}: {subject}")
        return {"sent": 1}
    # Real provider integration would go here
    return {"sent": 1}


def send_in_app(user_id: str, type_: str, payload: Dict[str, Any], channels: List[str] | None = None, status: str = "sent"):
    db.record_notification(user_id, type_, {**payload, "channels": channels or ["in_app"], "status": status})


# Backward-compatible alias used by routers
def send_in_app_notification(user_id: str, type_: str, payload: Dict[str, Any], channels: List[str] | None = None, status: str = "sent"):
    return send_in_app(user_id, type_, payload, channels, status)
