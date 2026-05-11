import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.base import get_db
from app.models import AuditLog
from app.schemas import AuditLogResponse, PaginatedResponse

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("/logs", response_model=PaginatedResponse)
def list_audit_logs(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    action: Optional[str] = Query(None),
    entity: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action)
    if entity:
        query = query.filter(AuditLog.entity_type == entity)
    if from_date:
        query = query.filter(AuditLog.created_at >= from_date)
    if to_date:
        query = query.filter(AuditLog.created_at <= to_date + "T23:59:59")

    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * pageSize).limit(pageSize).all()

    data = [AuditLogResponse.model_validate(log).model_dump() for log in logs]

    return PaginatedResponse(data=data, total=total, page=page, pageSize=pageSize)
