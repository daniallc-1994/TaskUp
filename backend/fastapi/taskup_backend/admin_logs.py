from datetime import datetime
from uuid import uuid4
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from .models import AdminLog


def log_admin_action(db: Session, admin_id: str, action: str, entity: str, entity_id: Optional[str], metadata: Optional[Dict[str, Any]] = None):
    log = AdminLog(
        id=str(uuid4()),
        admin_id=admin_id,
        action=action,
        entity=entity,
        entity_id=entity_id,
        details=metadata or {},
        created_at=datetime.utcnow(),
    )
    db.add(log)
    db.commit()
