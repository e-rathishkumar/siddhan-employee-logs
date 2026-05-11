from typing import Optional

from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.user import User


def create_audit_log(
    db: Session,
    user: User,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
    changes: Optional[dict] = None,
) -> AuditLog:
    log = AuditLog(
        user_id=user.id,
        user_name=user.name,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        ip_address=ip_address,
        changes=changes,
    )
    db.add(log)
    db.commit()
    return log
