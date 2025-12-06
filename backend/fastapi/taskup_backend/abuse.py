import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from uuid import uuid4

from sqlalchemy.orm import Session

from .errors import TaskUpError
from .logging_utils import log_event
from sqlalchemy import or_

from .models import BlockedUser, DeviceFingerprint, AdminLog
from .request_context import RequestContext

# simple in-memory counters for failed login / spam
_login_failures: Dict[str, list[float]] = {}
_activity: Dict[str, list[float]] = {}


def ensure_not_blocked(ctx: RequestContext, db: Session):
    """
    Check blocklist by user, ip, or device. Raises TaskUpError 403 if blocked.
    """
    q = db.query(BlockedUser)
    now = datetime.utcnow()
    conditions = []
    if ctx.user_id:
        conditions.append(BlockedUser.user_id == ctx.user_id)
    if ctx.ip:
        conditions.append(BlockedUser.ip_address == ctx.ip)
    if ctx.device_id:
        conditions.append(BlockedUser.device_id == ctx.device_id)
    if conditions:
        blocked = q.filter((BlockedUser.expires_at.is_(None) | (BlockedUser.expires_at > now))).filter(or_(*conditions))
        hit = blocked.first()
        if hit:
            raise TaskUpError(
                code="BLOCKED",
                message="Access blocked",
                type="permission",
                http_status=403,
                details={"reason": hit.reason},
            )


def log_device_fingerprint(ctx: RequestContext, db: Session):
    if not ctx.user_id or not ctx.ip:
        return
    fp_value = ctx.device_id or ctx.ip
    existing = (
        db.query(DeviceFingerprint)
        .filter(DeviceFingerprint.user_id == ctx.user_id, DeviceFingerprint.fingerprint == fp_value)
        .first()
    )
    if existing:
        existing.last_seen_at = datetime.utcnow()
    else:
        rec = DeviceFingerprint(
            id=str(uuid4()),
            user_id=ctx.user_id,
            ip_address=ctx.ip,
            fingerprint=fp_value,
            created_at=datetime.utcnow(),
        )
        db.add(rec)
    db.commit()
    log_event(user_id=ctx.user_id, action="device_fingerprint", extra={"ip": ctx.ip, "fingerprint": fp_value})


def record_failed_login(ctx: RequestContext, identifier: str, db: Session, threshold: int = 8, window_seconds: int = 600):
    now = time.time()
    key = ctx.ip or identifier
    bucket = _login_failures.get(key, [])
    bucket = [t for t in bucket if now - t < window_seconds]
    bucket.append(now)
    _login_failures[key] = bucket
    if len(bucket) >= threshold:
        # log admin alert
        log_event(action="abuse_login_bruteforce", user_id=identifier, extra={"ip": ctx.ip, "count": len(bucket)})
        # optionally block temporarily
        bu = BlockedUser(
            id=str(uuid4()),
            user_id=None,
            ip_address=ctx.ip,
            device_id=ctx.device_id,
            reason="Too many failed logins",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=30),
        )
        db.add(bu)
        db.commit()
        # record admin log if an admin exists
        admin = db.query(AdminLog).first()
        if admin:
            pass
        raise TaskUpError(code="BLOCKED", message="Too many failed attempts", type="rate_limit", http_status=403)


def record_suspicious_activity(ctx: RequestContext, db: Session, reason: str, metadata: Optional[Dict[str, Any]] = None):
    log_event(user_id=ctx.user_id, action="suspicious_activity", extra={"reason": reason, **(metadata or {})})
    # simple insert into admin_logs if user present
    if ctx.user_id:
        admin_log = AdminLog(
            id=str(uuid4()),
            admin_id=ctx.user_id,
            action="suspicious_activity",
            entity=reason,
            entity_id=None,
            details=metadata or {},
            created_at=datetime.utcnow(),
        )
        db.add(admin_log)
        db.commit()


def record_action(ctx: RequestContext, key: str, db: Session, limit: int = 20, window_seconds: int = 300):
    now = time.time()
    ident = ctx.user_id or ctx.ip or "unknown"
    bucket_key = f"{ident}:{key}"
    bucket = _activity.get(bucket_key, [])
    bucket = [t for t in bucket if now - t < window_seconds]
    bucket.append(now)
    _activity[bucket_key] = bucket
    if len(bucket) > limit:
        record_suspicious_activity(ctx, db, f"spam_{key}", {"count": len(bucket)})
