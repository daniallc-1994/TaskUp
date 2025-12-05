from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..security import get_current_user
from ..database import get_db
from ..models import Notification
from ..schemas import NotificationOut, NotificationReadResponse
from ..errors import not_found_error
from ..logging_utils import log_event

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=List[NotificationOut])
async def list_notifications(user=Depends(get_current_user), db: Session = Depends(get_db)):
    notes = db.query(Notification).filter(Notification.user_id == user["id"]).order_by(Notification.created_at.desc()).all()
    log_event(user_id=user.get("id"), action="notifications_list", extra={"count": len(notes)})
    return [NotificationOut.from_orm(n) for n in notes]


@router.post("/{notification_id}/read", response_model=NotificationReadResponse)
async def mark_read(notification_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user["id"]).first()
    if not note:
        raise not_found_error("NOTIFICATION_NOT_FOUND", "Notification not found")
    note.is_read = True
    db.commit()
    log_event(user_id=user.get("id"), action="notification_read", extra={"notification_id": notification_id})
    return NotificationReadResponse()
