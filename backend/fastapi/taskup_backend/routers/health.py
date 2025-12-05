from fastapi import APIRouter, Depends
from ..logging_utils import log_event
from ..security import get_current_user

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(user=Depends(get_current_user)):
    log_event(user_id=user.get("id") if isinstance(user, dict) else None, action="health_check", extra={})
    return {"status": "healthy"}
