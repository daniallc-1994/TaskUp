import json
import logging
from typing import Any, Dict, Optional
from fastapi import Request, Response

logger = logging.getLogger("taskup")


def log_event(
    *,
    request: Optional[Request] = None,
    response: Optional[Response] = None,
    user_id: Optional[str] = None,
    action: str,
    level: int = logging.INFO,
    extra: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Emit a structured log for important events (payments, disputes, admin actions).
    Includes correlation_id if present on request.state.
    """
    payload: Dict[str, Any] = extra.copy() if extra else {}
    if request:
        payload.setdefault("path", request.url.path)
        payload.setdefault("method", request.method)
        cid = getattr(request.state, "correlation_id", None)
        if cid:
            payload["correlation_id"] = cid
    if response:
        payload.setdefault("status_code", response.status_code)
    if user_id:
        payload.setdefault("user_id", user_id)
    payload["action"] = action
    logger.log(level, json.dumps(payload))
