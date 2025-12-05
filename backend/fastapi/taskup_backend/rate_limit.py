import time
from typing import Tuple
from .errors import rate_limit_error
from .logging_utils import log_event

_limits = {}


def check(identifier: str, key: str, limit: int = 30, window_seconds: int = 60):
    """
    Sliding-window in-memory rate limiter. Identifier can be ip or user id.
    """
    now = time.time()
    bucket_key: Tuple[str, str] = (identifier, key)
    bucket = _limits.get(bucket_key, [])
    bucket = [t for t in bucket if now - t < window_seconds]
    if len(bucket) >= limit:
        log_event(user_id=identifier, action="rate_limited", extra={"key": key, "limit": limit, "window": window_seconds})
        raise rate_limit_error(window_seconds)
    bucket.append(now)
    _limits[bucket_key] = bucket
