from datetime import datetime, timezone, date, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.deps import get_current_user
from app.db.base import get_db
from app.models import Employee, CheckLog, KioskLog
from app.schemas import DashboardSummary, EmployeeDashboardSummary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
_settings = get_settings()


def _get_local_now() -> datetime:
    tz = ZoneInfo(_settings.timezone)
    return datetime.now(tz)


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    today = _get_local_now().strftime("%Y-%m-%d")

    total_employees = db.query(Employee).filter(Employee.is_active == True).count()
    checked_in_today = db.query(CheckLog).filter(
        CheckLog.date == today,
        CheckLog.check_in.isnot(None),
    ).count()
    checked_out_today = db.query(CheckLog).filter(
        CheckLog.date == today,
        CheckLog.check_out.isnot(None),
    ).count()
    still_inside = checked_in_today - checked_out_today

    tz = ZoneInfo(_settings.timezone)

    recent = (
        db.query(CheckLog)
        .filter(CheckLog.date == today)
        .order_by(CheckLog.created_at.desc())
        .limit(20)
        .all()
    )
    recent_logs = []
    for log in recent:
        check_in_local = None
        check_out_local = None
        if log.check_in:
            ci = log.check_in
            if ci.tzinfo is None:
                ci = ci.replace(tzinfo=timezone.utc)
            check_in_local = ci.astimezone(tz).isoformat()
        if log.check_out:
            co = log.check_out
            if co.tzinfo is None:
                co = co.replace(tzinfo=timezone.utc)
            check_out_local = co.astimezone(tz).isoformat()
        recent_logs.append({
            "id": str(log.id),
            "employee_name": log.employee.name if log.employee else "Unknown",
            "employee_code": log.employee.employee_id if log.employee else "",
            "check_in": check_in_local,
            "check_out": check_out_local,
            "method": log.verification_method,
        })

    return DashboardSummary(
        total_employees=total_employees,
        checked_in_today=checked_in_today,
        checked_out_today=checked_out_today,
        still_inside=max(still_inside, 0),
        recent_logs=recent_logs,
    )


@router.get("/employee-summary", response_model=EmployeeDashboardSummary)
def get_employee_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get dashboard summary for the logged-in employee (mobile app)."""
    emp = db.query(Employee).filter(Employee.user_id == current_user.id, Employee.is_active == True).first()
    if not emp:
        return EmployeeDashboardSummary(employee_name="Unknown", employee_id="N/A")

    tz = ZoneInfo(_settings.timezone)
    local_now = _get_local_now()
    today = local_now.strftime("%Y-%m-%d")

    def _to_local_iso(dt):
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(tz).isoformat()

    # Today's log
    today_record = db.query(CheckLog).filter(
        CheckLog.employee_id == emp.id,
        CheckLog.date == today,
    ).first()

    checked_in = today_record is not None and today_record.check_in is not None
    check_in_time = _to_local_iso(today_record.check_in) if today_record else None
    check_out_time = _to_local_iso(today_record.check_out) if today_record else None

    # Build recent activity from CheckLog (single source of truth for check_in/check_out)
    # Source is derived from verification_method: "face" → kiosk, "geofence" → app
    recent_activity = []

    recent_check_logs = db.query(CheckLog).filter(
        CheckLog.employee_id == emp.id,
    ).order_by(CheckLog.created_at.desc()).limit(20).all()

    for log in recent_check_logs:
        # Determine source from verification method
        source = "kiosk" if log.verification_method == "face" else "app"

        if log.check_in:
            recent_activity.append({
                "id": str(log.id) + "_in",
                "detected_at": _to_local_iso(log.check_in),
                "confidence": log.face_confidence,
                "action": "check_in",
                "source": source,
                "verification_method": log.verification_method,
            })
        if log.check_out:
            # For check_out, check if kiosk did the checkout
            checkout_source = source
            if log.check_out:
                kiosk_co = db.query(KioskLog).filter(
                    KioskLog.employee_id == emp.id,
                    KioskLog.action == "check_out",
                    KioskLog.detected_at >= log.check_out - timedelta(seconds=30),
                    KioskLog.detected_at <= log.check_out + timedelta(seconds=30),
                ).first()
                if kiosk_co:
                    checkout_source = "kiosk"
                else:
                    checkout_source = "app"
            recent_activity.append({
                "id": str(log.id) + "_out",
                "detected_at": _to_local_iso(log.check_out),
                "confidence": None,
                "action": "check_out",
                "source": checkout_source,
                "verification_method": log.verification_method,
            })

    # Include only "continue" actions from KioskLog (not check_in/check_out which are in CheckLog)
    kiosk_continue_logs = db.query(KioskLog).filter(
        KioskLog.employee_id == emp.id,
        KioskLog.action == "continue",
    ).order_by(KioskLog.detected_at.desc()).limit(10).all()

    for log in kiosk_continue_logs:
        recent_activity.append({
            "id": str(log.id),
            "detected_at": _to_local_iso(log.detected_at),
            "confidence": log.confidence,
            "action": log.action,
            "source": "kiosk",
        })

    # Sort all activity by time descending
    recent_activity.sort(key=lambda x: x.get("detected_at") or "", reverse=True)
    recent_activity = recent_activity[:30]

    # Profile photo URL
    profile_photo_url = None
    if emp.face_photos:
        primary = next((p for p in emp.face_photos if p.is_primary), None)
        if primary:
            profile_photo_url = f"/uploads/faces/{primary.file_path}"
        elif emp.face_photos:
            profile_photo_url = f"/uploads/faces/{emp.face_photos[0].file_path}"

    # Monthly attendance summary (current calendar month)
    month_start = local_now.replace(day=1).strftime("%Y-%m-%d")
    month_logs = db.query(CheckLog).filter(
        CheckLog.employee_id == emp.id,
        CheckLog.date >= month_start,
        CheckLog.date <= today,
    ).all()
    logged_dates = {log.date for log in month_logs}

    # Build all calendar days in current month up to today
    start_date = date.fromisoformat(month_start)
    end_date = date.fromisoformat(today)
    all_days = []
    d = start_date
    while d <= end_date:
        all_days.append(d.isoformat())
        d += timedelta(days=1)

    # Late threshold: check_in > 09:00 local time (configurable if needed)
    LATE_HOUR = 9

    present_dates: list[str] = []
    late_dates: list[str] = []
    absent_dates: list[str] = []

    for day in all_days:
        logs_for_day = [l for l in month_logs if l.date == day]
        if logs_for_day:
            # Present — check if any check_in is late
            is_late = False
            for l in logs_for_day:
                if l.check_in:
                    ci = l.check_in
                    if ci.tzinfo is None:
                        ci = ci.replace(tzinfo=timezone.utc)
                    local_ci = ci.astimezone(tz)
                    if local_ci.hour > LATE_HOUR or (local_ci.hour == LATE_HOUR and local_ci.minute > 0):
                        is_late = True
            if is_late:
                late_dates.append(day)
            else:
                present_dates.append(day)
        else:
            # Only count as absent if it's a past day (not today without a log yet)
            if day < today:
                absent_dates.append(day)

    present_days = len(present_dates)
    absent_days = len(absent_dates)
    late_days = len(late_dates)

    return EmployeeDashboardSummary(
        employee_name=emp.name,
        employee_id=emp.employee_id,
        checked_in=checked_in,
        check_in_time=check_in_time,
        check_out_time=check_out_time,
        recent_activity=recent_activity,
        profile_photo_url=profile_photo_url,
        present_days=present_days,
        absent_days=absent_days,
        late_days=late_days,
        present_dates=present_dates,
        absent_dates=absent_dates,
        late_dates=late_dates,
    )
