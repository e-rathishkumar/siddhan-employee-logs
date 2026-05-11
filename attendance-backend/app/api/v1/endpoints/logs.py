import uuid
import csv
import io
from datetime import datetime, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.config import get_settings
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.base import get_db
from app.models import CheckLog, Employee, Geofence
from app.schemas import CheckLogResponse, PaginatedResponse, CheckInRequest, CheckOutRequest

router = APIRouter(prefix="/logs", tags=["Logs"])
_settings = get_settings()


def _get_local_now() -> datetime:
    tz = ZoneInfo(_settings.timezone)
    return datetime.now(tz)


def _to_local(dt):
    if dt is None:
        return None
    tz = ZoneInfo(_settings.timezone)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(tz)


@router.get("", response_model=PaginatedResponse)
def list_logs(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    date: Optional[str] = Query(None),
    employeeId: Optional[uuid.UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(CheckLog)
    if date:
        query = query.filter(CheckLog.date == date)
    if employeeId:
        query = query.filter(CheckLog.employee_id == employeeId)

    total = query.count()
    records = query.order_by(CheckLog.date.desc(), CheckLog.check_in.desc()).offset(
        (page - 1) * pageSize
    ).limit(pageSize).all()

    data = []
    for r in records:
        data.append(CheckLogResponse(
            id=r.id,
            employee_id=r.employee_id,
            employee_name=r.employee.name if r.employee else None,
            employee_code=r.employee.employee_id if r.employee else None,
            date=r.date,
            check_in=_to_local(r.check_in),
            check_out=_to_local(r.check_out),
            verification_method=r.verification_method,
            face_confidence=r.face_confidence,
            lat=r.lat,
            lng=r.lng,
            created_at=_to_local(r.created_at),
        ).model_dump())

    return PaginatedResponse(data=data, total=total, page=page, pageSize=pageSize)


@router.get("/today")
def get_today_log(
    employee_id: Optional[uuid.UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get today's check log for the current user or specified employee."""
    today = _get_local_now().strftime("%Y-%m-%d")

    if employee_id:
        emp_id = employee_id
    else:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp:
            return None
        emp_id = emp.id

    record = db.query(CheckLog).filter(
        CheckLog.employee_id == emp_id,
        CheckLog.date == today,
    ).first()

    if not record:
        return None

    return CheckLogResponse(
        id=record.id,
        employee_id=record.employee_id,
        employee_name=record.employee.name if record.employee else None,
        employee_code=record.employee.employee_id if record.employee else None,
        date=record.date,
        check_in=_to_local(record.check_in),
        check_out=_to_local(record.check_out),
        verification_method=record.verification_method,
        face_confidence=record.face_confidence,
        lat=record.lat,
        lng=record.lng,
        created_at=_to_local(record.created_at),
    )


@router.post("/check-in")
def check_in(
    payload: CheckInRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Check in the current user with geofence verification."""
    emp = db.query(Employee).filter(Employee.user_id == current_user.id, Employee.is_active == True).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    local_now = _get_local_now()
    today = local_now.strftime("%Y-%m-%d")

    existing = db.query(CheckLog).filter(
        CheckLog.employee_id == emp.id,
        CheckLog.date == today,
    ).first()

    if existing and existing.check_out is None:
        raise HTTPException(status_code=400, detail="Already checked in today")

    # Verify geofence
    zones = db.query(Geofence).filter(Geofence.is_active == True).all()
    inside = False
    matched_zone = None
    if not zones:
        inside = True
    else:
        import math
        for zone in zones:
            dist = _haversine(payload.lat, payload.lng, zone.center_lat, zone.center_lng)
            if dist <= zone.radius_meters:
                inside = True
                matched_zone = zone
                break
    if not inside:
        raise HTTPException(status_code=400, detail="You are outside the allowed geofence area")

    utc_now = datetime.now(timezone.utc)
    record = CheckLog(
        employee_id=emp.id,
        date=today,
        check_in=utc_now,
        verification_method="geofence",
        lat=payload.lat,
        lng=payload.lng,
        geofence_id=matched_zone.id if matched_zone else None,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Broadcast check-in via WebSocket
    from app.services.ws_manager import manager
    manager.notify_employee(
        str(emp.id),
        {"event": "attendance_update", "data": {"action": "check_in", "name": emp.name}},
    )

    return CheckLogResponse(
        id=record.id,
        employee_id=record.employee_id,
        employee_name=emp.name,
        employee_code=emp.employee_id,
        date=record.date,
        check_in=_to_local(record.check_in),
        check_out=None,
        verification_method=record.verification_method,
        lat=record.lat,
        lng=record.lng,
        created_at=_to_local(record.created_at),
    )


@router.post("/check-out")
def check_out(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Check out the current user. No geofence required for check-out."""
    emp = db.query(Employee).filter(Employee.user_id == current_user.id, Employee.is_active == True).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    today = _get_local_now().strftime("%Y-%m-%d")

    record = db.query(CheckLog).filter(
        CheckLog.employee_id == emp.id,
        CheckLog.date == today,
        CheckLog.check_out.is_(None),
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="No active check-in found for today")

    record.check_out = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)

    # Broadcast check-out via WebSocket
    from app.services.ws_manager import manager
    manager.notify_employee(
        str(emp.id),
        {"event": "attendance_update", "data": {"action": "check_out", "name": emp.name}},
    )

    return CheckLogResponse(
        id=record.id,
        employee_id=record.employee_id,
        employee_name=emp.name,
        employee_code=emp.employee_id,
        date=record.date,
        check_in=_to_local(record.check_in),
        check_out=_to_local(record.check_out),
        verification_method=record.verification_method,
        lat=record.lat,
        lng=record.lng,
        created_at=_to_local(record.created_at),
    )


@router.get("/export")
def export_logs(
    date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(CheckLog)
    if date:
        query = query.filter(CheckLog.date == date)

    records = query.order_by(CheckLog.date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Employee ID", "Employee Name", "Check In", "Check Out", "Method"])

    for r in records:
        writer.writerow([
            r.date,
            r.employee.employee_id if r.employee else "",
            r.employee.name if r.employee else "",
            _to_local(r.check_in).isoformat() if r.check_in else "",
            _to_local(r.check_out).isoformat() if r.check_out else "",
            r.verification_method,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=logs_export.csv"},
    )


def _haversine(lat1, lon1, lat2, lon2):
    import math
    R = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
