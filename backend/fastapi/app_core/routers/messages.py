from fastapi import APIRouter, Depends, HTTPException
from uuid import uuid4
from typing import List
from ..models import Message, MessageCreate
from ..security import get_current_user
from ..rate_limit import check
from .. import db
from ..notifications import send_in_app_notification


router = APIRouter(prefix="/messages", tags=["messages"])


def _normalize(raw: dict) -> dict:
    raw = raw or {}
    if "id" not in raw:
        raw["id"] = str(uuid4())
    return raw


@router.get("", response_model=List[Message])
async def list_messages(task_id: str, user=Depends(get_current_user)):
    messages = db.list_messages(task_id, jwt=user.get("token"))
    return [Message(**_normalize(m)) for m in messages]


@router.post("", response_model=Message)
async def create_message(payload: MessageCreate, user=Depends(get_current_user)):
    check(user.get("id"), "message", limit=300, window_seconds=300)
    if payload.sender_id != user.get("id"):
        raise HTTPException(status_code=403, detail="Sender mismatch")
    saved = db.create_message(
        {
            "task_id": payload.task_id,
            "sender_id": payload.sender_id,
            "recipient_id": payload.recipient_id,
            "body": payload.body,
        },
        jwt=user.get("token"),
    )
    if saved:
        send_in_app_notification(payload.recipient_id, "new_message", {"task_id": payload.task_id, "message_id": saved.get("id")})
        return Message(**_normalize(saved))
    return Message(**_normalize(payload.dict()))
