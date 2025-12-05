from fastapi import APIRouter, Depends
from uuid import uuid4
from typing import List
from datetime import datetime
from sqlalchemy.orm import Session

from ..schemas import MessageOut, MessageCreate
from ..security import get_current_user
from ..rate_limit import check
from ..database import get_db
from ..models import Message, Task
from ..notifications import create_notification
from ..errors import not_found_error, permission_error
from ..logging_utils import log_event
from ..admin_logs import log_admin_action

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("", response_model=List[MessageOut])
async def list_messages(task_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise not_found_error("TASK_NOT_FOUND", "Task not found")
    # Only client or assigned tasker or admin can view
    if user.get("role") != "admin" and user.get("id") not in (task.client_id, task.assigned_tasker_id):
        raise permission_error("MESSAGE_FORBIDDEN", "Forbidden")
    messages = (
        db.query(Message)
        .filter(Message.task_id == task_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    log_event(user_id=user.get("id"), action="messages_list", extra={"task_id": task_id, "count": len(messages)})
    return [MessageOut.from_orm(m) for m in messages]


@router.post("", response_model=MessageOut)
async def create_message(payload: MessageCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    check(user.get("id"), "message", limit=300, window_seconds=300)
    task = db.query(Task).filter(Task.id == payload.task_id).first()
    if not task:
        raise not_found_error("TASK_NOT_FOUND", "Task not found")
    if user.get("role") != "admin" and payload.sender_id != user.get("id"):
        raise permission_error("MESSAGE_FORBIDDEN", "Sender mismatch")
    if user.get("role") != "admin" and payload.sender_id not in (task.client_id, task.assigned_tasker_id):
        raise permission_error("MESSAGE_FORBIDDEN", "Only participants can send messages")

    msg = Message(
        id=str(uuid4()),
        task_id=payload.task_id,
        sender_id=payload.sender_id,
        receiver_id=payload.recipient_id,
        content=payload.body,
        created_at=datetime.utcnow(),
        is_read=False,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    # Notification
    create_notification(db, payload.recipient_id, "new_message", "New message", f"New message on task {payload.task_id}", {"task_id": payload.task_id})
    log_event(user_id=user.get("id"), action="message_sent", extra={"task_id": payload.task_id, "message_id": msg.id})
    if user.get("role") == "admin":
        log_admin_action(db, user.get("id"), "message_sent", "message", msg.id, {"task_id": payload.task_id})
    return MessageOut.from_orm(msg)
