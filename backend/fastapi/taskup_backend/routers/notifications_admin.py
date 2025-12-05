from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..security import require_roles
from ..database import get_db
from ..models import Notification
from ..errors import correlation_id_from_request
from ..logging_utils import log_event
from ..admin_logs import log_admin_action

router = APIRouter(prefix="/admin/notifications", tags=["admin-notifications"])


@router.get("")
async def admin_list_notifications(request, user=Depends(require_roles("admin", "support", "moderator")), db: Session = Depends(get_db)):
    cid = correlation_id_from_request(request)
    notes = db.query(Notification).order_by(Notification.created_at.desc()).all()
    log_event(user_id=user.get("id"), action="admin_notifications_list", extra={"count": len(notes)})
    log_admin_action(db, user.get("id"), "notifications_list", "notification", None, {"count": len(notes)})
    return {"success": True, "data": [n.id for n in notes], "correlation_id": cid}
