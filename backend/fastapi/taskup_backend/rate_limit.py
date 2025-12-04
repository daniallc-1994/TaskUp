import time
from fastapi import HTTPException, status

_limits = {}


def check(ip: str, key: str, limit: int = 30, window_seconds: int = 60):
    now = time.time()
    bucket = _limits.get((ip, key), [])
    bucket = [t for t in bucket if now - t < window_seconds]
    if len(bucket) >= limit:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded")
    bucket.append(now)
    _limits[(ip, key)] = bucket
