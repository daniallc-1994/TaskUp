from dataclasses import dataclass
from typing import Optional
from fastapi import Request


@dataclass
class RequestContext:
    ip: Optional[str]
    user_agent: Optional[str]
    device_id: Optional[str]
    user_id: Optional[str]


def get_request_context(request: Request, current_user: Optional[dict] = None) -> RequestContext:
    """
    Extract basic request metadata for abuse detection and logging.
    Prefers X-Forwarded-For for IP if present.
    """
    ip = None
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    elif request.client:
        ip = request.client.host
    user_agent = request.headers.get("User-Agent")
    device_id = request.headers.get("X-Device-Id")
    user_id = current_user.get("id") if current_user else None
    return RequestContext(ip=ip, user_agent=user_agent, device_id=device_id, user_id=user_id)
