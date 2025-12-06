from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from ..database import get_db

from ..security import get_current_user, require_roles
from ..config import get_settings
from ..feature_flags import get_feature_flags, set_feature_flag
from ..errors import correlation_id_from_request
from ..logging_utils import log_event
from ..notifications import notify_admins
from ..admin_logs import log_admin_action
from fastapi import HTTPException

router = APIRouter(prefix="/config", tags=["config"])


@router.get("")
async def get_config(request: Request, user=Depends(get_current_user)):
    cid = correlation_id_from_request(request)
    settings = get_settings()
    log_event(user_id=user.get("id"), action="config_fetch", extra={"env": settings.environment})
    return {
        "success": True,
        "data": {
            "feature_flags": get_feature_flags(),
            "environment": settings.environment,
        },
        "correlation_id": cid,
    }


@router.post("/flags")
async def set_flag(name: str, enabled: bool, request: Request, user=Depends(require_roles("admin", "support", "moderator")), db=Depends(get_db)):
    cid = correlation_id_from_request(request)
    if not set_feature_flag(name, enabled):
        raise HTTPException(status_code=400, detail="Unknown flag")
    log_event(user_id=user.get("id"), action="feature_flag_set", extra={"flag": name, "enabled": enabled})
    log_admin_action(db, user.get("id"), "feature_flag_set", "feature_flag", name, {"enabled": enabled})
    notify_admins(db, "feature_flag", f"Feature flag {name}", f"Set to {enabled}", {"flag": name, "enabled": enabled})
    return {"success": True, "correlation_id": cid, "feature_flags": get_feature_flags()}
