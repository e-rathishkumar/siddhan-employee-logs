import os
import io
import uuid
from datetime import datetime, timezone, timedelta
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.base import get_db
from app.models import Employee, FacePhoto, KioskLog, CheckLog
from app.services.ws_manager import manager
from app.services.face_recognition_service import (
    register_face,
    register_face_360,
    detect_and_match,
    detect_and_match_all,
    mark_log_by_face,
    daily_face_update,
    kiosk_checkout,
    kiosk_continue,
    invalidate_cache,
    UPLOAD_DIR,
    _preprocess_image,
    _get_face_recognition,
)

router = APIRouter(prefix="/face", tags=["Face Recognition"])


@router.post("/validate")
async def validate_face(file: UploadFile = File(...)):
    """Validate if a face is detected in the uploaded image."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    try:
        face_rec = _get_face_recognition()
        image_array = _preprocess_image(contents)
        face_locations = face_rec.face_locations(image_array, model="hog")
        encodings = face_rec.face_encodings(image_array, face_locations)

        if not face_locations or not encodings:
            return {"face_detected": False, "message": "No face detected. Please ensure your face is clearly visible."}
        if len(face_locations) > 1:
            return {"face_detected": False, "message": "Multiple faces detected. Please ensure only your face is visible."}
        return {"face_detected": True, "message": "Face detected successfully."}
    except Exception as e:
        return {"face_detected": False, "message": f"Face validation failed: {str(e)}"}


@router.post("/register-self")
async def register_self_face(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Register face photo for the currently logged-in employee (single image, legacy)."""
    emp = db.query(Employee).filter(Employee.user_id == current_user.id, Employee.is_active == True).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    try:
        file_path = register_face(db, emp.id, contents, file.filename or "photo.jpg")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    photo = db.query(FacePhoto).filter(
        FacePhoto.employee_id == emp.id, FacePhoto.is_primary == True
    ).first()
    photo_url = f"/uploads/faces/{photo.file_path}" if photo else None

    # Pre-generate avatar in background so it's ready for kiosk
    from app.services.avatar_service import generate_avatar_background
    background_tasks.add_task(generate_avatar_background, str(emp.id))

    return {
        "message": "Face registered successfully",
        "file_path": file_path,
        "photo_url": photo_url,
    }


@router.post("/register-360")
async def register_360_face(
    files: List[UploadFile] = File(...),
    angles: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Register 360-degree face photos for the currently logged-in employee.
    
    Accepts multiple images with corresponding angle labels.
    angles: comma-separated angle labels (e.g., "front,left_45,left_90,right_45,right_90,up,down")
    """
    emp = db.query(Employee).filter(Employee.user_id == current_user.id, Employee.is_active == True).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    angle_list = [a.strip() for a in angles.split(",")]
    if len(angle_list) != len(files):
        raise HTTPException(status_code=400, detail="Number of angles must match number of files")

    valid_angles = {"front", "left_45", "left_90", "right_45", "right_90", "up", "down"}
    for angle in angle_list:
        if angle not in valid_angles:
            raise HTTPException(status_code=400, detail=f"Invalid angle: {angle}. Valid: {valid_angles}")

    images = []
    for file, angle in zip(files, angle_list):
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail=f"File for angle {angle} must be an image")
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"Image for angle {angle} too large (max 10MB)")
        images.append((contents, file.filename or f"{angle}.jpg", angle))

    try:
        saved_paths = register_face_360(db, emp.id, images)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Get the primary photo URL
    photo = db.query(FacePhoto).filter(
        FacePhoto.employee_id == emp.id, FacePhoto.is_primary == True
    ).first()
    photo_url = f"/uploads/faces/{photo.file_path}" if photo else None

    # Pre-generate avatar in background
    from app.services.avatar_service import generate_avatar_background
    background_tasks.add_task(generate_avatar_background, str(emp.id))

    return {
        "message": f"360° face registration complete ({len(saved_paths)} angles captured)",
        "angles_registered": len(saved_paths),
        "photo_url": photo_url,
    }


@router.post("/detect")
async def detect_faces(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Detect and identify faces in an image. Used by kiosk."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 5MB)")

    matches = detect_and_match(db, contents)
    return {"faces": matches, "count": len(matches)}


@router.post("/detect-and-mark")
async def detect_and_mark_log(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Detect faces and mark check-in/check-out log. Used by kiosk.
    Also performs daily face update for rolling 5-day training.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 5MB)")

    matched, unmatched = detect_and_match_all(db, contents)

    results = []
    for match in matched:
        emp_id = uuid.UUID(match["employee_id"])
        log_result = mark_log_by_face(db, emp_id, match["confidence"])

        # Only create a KioskLog for a genuine check_in action (not already_in/detected)
        # This prevents duplicate entries appearing in the employee's log history
        action = log_result.get("action", "detected")
        if action == "check_in":
            one_minute_ago = datetime.now(timezone.utc) - timedelta(seconds=60)
            recent_log = db.query(KioskLog).filter(
                KioskLog.employee_id == emp_id,
                KioskLog.detected_at >= one_minute_ago,
            ).first()
            if not recent_log:
                kiosk_log = KioskLog(
                    employee_id=emp_id,
                    confidence=match["confidence"],
                    action=action,
                )
                db.add(kiosk_log)

        # Perform daily face update for rolling 5-day training
        daily_face_update(db, emp_id, contents)

        # Include profile photo URL and avatar GLB URL if available
        emp = db.query(Employee).filter(Employee.id == emp_id).first()
        avatar_glb_url = emp.avatar_glb_url if emp else None
        gender = emp.gender if emp else None
        profile_photo_url = None
        if emp and emp.face_photos:
            primary = next((p for p in emp.face_photos if p.is_primary), None)
            if primary:
                profile_photo_url = f"/uploads/faces/{primary.file_path}"
            elif emp.face_photos:
                profile_photo_url = f"/uploads/faces/{emp.face_photos[0].file_path}"

        results.append({
            **match,
            "log": log_result,
            "avatar_glb_url": avatar_glb_url,
            "profile_photo_url": profile_photo_url,
            "gender": gender,
        })

    if results:
        db.commit()

    # Broadcast real-time updates via WebSocket to affected employees
    for r in results:
        action = r.get("log", {}).get("action", "detected")
        if action in ("check_in", "already_in", "check_out"):
            manager.notify_employee(
                r["employee_id"],
                {"event": "attendance_update", "data": {"action": action, "name": r["name"]}},
            )

    return {
        "faces": results,
        "unmatched_faces": unmatched,
        "count": len(results),
        "unmatched_count": len(unmatched),
    }


@router.post("/kiosk-checkout/{employee_id}")
def kiosk_checkout_endpoint(
    employee_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Kiosk checkout for a specific employee."""
    result = kiosk_checkout(db, employee_id)

    kiosk_log = KioskLog(
        employee_id=employee_id,
        confidence=1.0,
        action="check_out",
    )
    db.add(kiosk_log)
    db.commit()

    # Broadcast kiosk checkout via WebSocket
    manager.notify_employee(
        str(employee_id),
        {"event": "attendance_update", "data": {"action": "check_out"}},
    )

    return result


@router.post("/kiosk-continue/{employee_id}")
def kiosk_continue_endpoint(
    employee_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Log that the employee chose to continue (not checkout)."""
    result = kiosk_continue(db, employee_id)

    kiosk_log = KioskLog(
        employee_id=employee_id,
        confidence=1.0,
        action="continue",
    )
    db.add(kiosk_log)
    db.commit()

    # Broadcast kiosk continue via WebSocket
    manager.notify_employee(
        str(employee_id),
        {"event": "attendance_update", "data": {"action": "continue"}},
    )

    return result


@router.post("/kiosk-recheckin/{employee_id}")
def kiosk_recheckin_endpoint(
    employee_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Re-check-in an employee who already checked out today."""
    from app.services.face_recognition_service import _get_local_now
    local_now = _get_local_now()
    utc_now = datetime.now(timezone.utc)
    today = local_now.strftime("%Y-%m-%d")

    record = CheckLog(
        employee_id=employee_id,
        date=today,
        check_in=utc_now,
        verification_method="face",
        face_confidence=1.0,
    )
    db.add(record)

    kiosk_log = KioskLog(
        employee_id=employee_id,
        confidence=1.0,
        action="check_in",
    )
    db.add(kiosk_log)
    db.commit()

    manager.notify_employee(
        str(employee_id),
        {"event": "attendance_update", "data": {"action": "check_in"}},
    )

    return {"action": "check_in", "record_id": str(record.id)}


@router.post("/reload-cache")
def reload_face_cache(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    invalidate_cache()
    return {"message": "Face encoding cache cleared."}


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_face_photo(
    photo_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    photo = db.query(FacePhoto).filter(FacePhoto.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    employee_id = photo.employee_id
    file_path = os.path.join(UPLOAD_DIR, photo.file_path)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(photo)
    remaining = db.query(FacePhoto).filter(
        FacePhoto.employee_id == employee_id, FacePhoto.id != photo_id
    ).first()
    if remaining:
        remaining.is_primary = True

    db.commit()
    invalidate_cache(employee_id)
