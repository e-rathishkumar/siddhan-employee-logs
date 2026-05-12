import os
import io
import json
import uuid
import logging
from datetime import datetime, timezone, date, timedelta
from typing import Optional, Tuple, List
from zoneinfo import ZoneInfo

import numpy as np
from PIL import Image, ImageOps
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Employee, FacePhoto
from app.models.log import CheckLog

logger = logging.getLogger(__name__)
settings = get_settings()

_face_recognition = None


def _get_face_recognition():
    global _face_recognition
    if _face_recognition is None:
        import face_recognition
        _face_recognition = face_recognition
    return _face_recognition


UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "faces")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Cache: employee_id -> (list_of_encodings, name, employee_code)
_encoding_cache: dict[uuid.UUID, Tuple[List[np.ndarray], str, str]] = {}
_cache_loaded = False

# Number of days to keep rolling face data
ROLLING_WINDOW_DAYS = 5
# Minimum confidence (1 - distance) for a match
# face_recognition default tolerance is 0.6 distance → 0.4 confidence
# 0.55 balances accuracy vs usability for 360° registered faces
MIN_CONFIDENCE = 0.55


def _preprocess_image(image_bytes: bytes, max_dimension: int = 800) -> np.ndarray:
    """Preprocess image for face recognition with enhanced quality.
    
    Args:
        max_dimension: Cap the largest dimension to this value.
                       Use 640 for fast kiosk detection, 800 for registration.
    """
    img_pil = Image.open(io.BytesIO(image_bytes))
    img_pil = ImageOps.exif_transpose(img_pil)
    img_pil = img_pil.convert("RGB")

    # Downscale large images for faster face_encodings()
    max_dim = max(img_pil.width, img_pil.height)
    if max_dim > max_dimension:
        scale = max_dimension / max_dim
        img_pil = img_pil.resize(
            (int(img_pil.width * scale), int(img_pil.height * scale)),
            Image.LANCZOS,
        )

    # Ensure minimum resolution for better face detection
    min_dim = min(img_pil.width, img_pil.height)
    if min_dim < 480:
        scale = 480 / min_dim
        img_pil = img_pil.resize(
            (int(img_pil.width * scale), int(img_pil.height * scale)),
            Image.LANCZOS,
        )

    # Auto-contrast for better face feature extraction
    from PIL import ImageEnhance
    enhancer = ImageEnhance.Contrast(img_pil)
    img_pil = enhancer.enhance(1.2)

    return np.array(img_pil)


def _load_encodings(db: Session) -> None:
    """Load ALL face encodings (registration + daily rolling) into cache."""
    global _cache_loaded
    face_rec = _get_face_recognition()

    # Load all face photos for active employees
    photos = db.query(FacePhoto).join(Employee).filter(
        Employee.is_active == True,
    ).all()

    # Group by employee
    employee_photos: dict[uuid.UUID, list] = {}
    for photo in photos:
        if photo.employee_id not in employee_photos:
            employee_photos[photo.employee_id] = []
        employee_photos[photo.employee_id].append(photo)

    for emp_id, emp_photos in employee_photos.items():
        if emp_id in _encoding_cache:
            continue

        encodings = []
        emp_name = None
        emp_code = None

        for photo in emp_photos:
            emp = photo.employee
            emp_name = emp.name
            emp_code = emp.employee_id

            encoding = None
            if photo.face_encoding:
                try:
                    encoding = np.array(json.loads(photo.face_encoding))
                except Exception as e:
                    logger.warning(f"Failed to load stored encoding for {photo.employee_id}: {e}")

            if encoding is None:
                file_path = os.path.join(UPLOAD_DIR, photo.file_path)
                if not os.path.exists(file_path):
                    continue
                try:
                    with open(file_path, "rb") as f:
                        image_bytes = f.read()
                    image_array = _preprocess_image(image_bytes)
                    face_encodings = face_rec.face_encodings(image_array)
                    if face_encodings:
                        encoding = face_encodings[0]
                        photo.face_encoding = json.dumps(encoding.tolist())
                        db.commit()
                except Exception as e:
                    logger.warning(f"Failed to encode face for employee {photo.employee_id}: {e}")
                    continue

            if encoding is not None:
                encodings.append(encoding)

        if encodings and emp_name:
            _encoding_cache[emp_id] = (encodings, emp_name, emp_code)

    _cache_loaded = True
    total_encodings = sum(len(v[0]) for v in _encoding_cache.values())
    logger.info(f"Loaded {total_encodings} face encodings for {len(_encoding_cache)} employees into cache")


def invalidate_cache(employee_id: Optional[uuid.UUID] = None) -> None:
    global _cache_loaded
    if employee_id:
        _encoding_cache.pop(employee_id, None)
    else:
        _encoding_cache.clear()
        _cache_loaded = False


def register_face(db: Session, employee_id: uuid.UUID, image_bytes: bytes, filename: str) -> str:
    """Register a single face photo (legacy support)."""
    return register_face_with_angle(db, employee_id, image_bytes, filename, "front")


def register_face_with_angle(
    db: Session, employee_id: uuid.UUID, image_bytes: bytes, filename: str, angle_label: str
) -> str:
    """Register a face photo with angle label for 360° registration."""
    face_rec = _get_face_recognition()
    image_array = _preprocess_image(image_bytes)
    encodings = face_rec.face_encodings(image_array)
    if not encodings:
        raise ValueError(f"No face detected in the uploaded image (angle: {angle_label})")

    safe_filename = f"{employee_id}_{angle_label}_{uuid.uuid4().hex[:8]}.jpg"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    normalized_img = Image.fromarray(image_array)
    normalized_img.save(file_path, "JPEG", quality=95)

    today = date.today().isoformat()

    # For 360° registration: set as permanent (day_slot=0)
    # Mark previous primary as non-primary if this is the "front" angle
    if angle_label == "front":
        db.query(FacePhoto).filter(
            FacePhoto.employee_id == employee_id,
            FacePhoto.angle_label == "front",
            FacePhoto.day_slot == 0,
        ).update({"is_primary": False})

    photo = FacePhoto(
        employee_id=employee_id,
        file_path=safe_filename,
        is_primary=(angle_label == "front"),
        face_encoding=json.dumps(encodings[0].tolist()),
        angle_label=angle_label,
        capture_date=today,
        day_slot=0,
    )
    db.add(photo)
    db.commit()

    # Update cache
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if emp:
        if employee_id in _encoding_cache:
            existing_encodings, name, code = _encoding_cache[employee_id]
            existing_encodings.append(encodings[0])
            _encoding_cache[employee_id] = (existing_encodings, name, code)
        else:
            _encoding_cache[employee_id] = ([encodings[0]], emp.name, emp.employee_id)

    logger.info(f"Registered face for employee {employee_id} (angle: {angle_label})")
    return safe_filename


def _save_face_photo(
    db: Session, employee_id: uuid.UUID, image_array: np.ndarray,
    encoding: np.ndarray, angle_label: str,
) -> str:
    """Save a face photo with a pre-computed encoding (no re-encoding needed)."""
    safe_filename = f"{employee_id}_{angle_label}_{uuid.uuid4().hex[:8]}.jpg"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    normalized_img = Image.fromarray(image_array)
    normalized_img.save(file_path, "JPEG", quality=85)

    today = date.today().isoformat()

    photo = FacePhoto(
        employee_id=employee_id,
        file_path=safe_filename,
        is_primary=(angle_label == "front"),
        face_encoding=json.dumps(encoding.tolist()),
        angle_label=angle_label,
        capture_date=today,
        day_slot=0,
    )
    db.add(photo)

    # Update cache
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if emp:
        if employee_id in _encoding_cache:
            existing_encodings, name, code = _encoding_cache[employee_id]
            existing_encodings.append(encoding)
            _encoding_cache[employee_id] = (existing_encodings, name, code)
        else:
            _encoding_cache[employee_id] = ([encoding], emp.name, emp.employee_id)

    logger.info(f"Saved face for employee {employee_id} (angle: {angle_label})")
    return safe_filename


def register_face_360(
    db: Session, employee_id: uuid.UUID, images: List[Tuple[bytes, str, str]]
) -> List[str]:
    """Register multiple face photos for 360° face capture.
    
    Validates that all angle photos belong to the same person by comparing
    their face encodings against the front-facing photo.
    Caches encodings from validation pass to avoid recomputing during save.
    
    Args:
        images: List of (image_bytes, filename, angle_label) tuples
        
    Returns:
        List of saved file paths
    """
    face_rec = _get_face_recognition()
    
    # Extract the front image first for identity validation
    front_images = [(b, f, a) for b, f, a in images if a == "front"]
    other_images = [(b, f, a) for b, f, a in images if a != "front"]
    
    if not front_images:
        raise ValueError("Front-facing photo is required for face registration")
    
    # -- Single pass: preprocess + encode all images, validate identity --
    # This avoids calling face_encodings() twice per image (was 10 calls, now 5)
    processed: list[tuple[np.ndarray, np.ndarray | None, str]] = []  # (image_array, encoding_or_None, angle)
    
    # Front image first
    front_bytes, front_filename, front_angle = front_images[0]
    front_array = _preprocess_image(front_bytes)
    front_encodings = face_rec.face_encodings(front_array)
    if not front_encodings:
        raise ValueError("No face detected in the front-facing photo. Please try again with better lighting.")
    front_encoding = front_encodings[0]
    processed.append((front_array, front_encoding, "front"))
    
    # Validate and encode other images
    IDENTITY_TOLERANCE = 0.55
    for img_bytes, filename, angle in other_images:
        try:
            img_array = _preprocess_image(img_bytes)
            encodings = face_rec.face_encodings(img_array)
            if not encodings:
                logger.warning(f"No face detected for angle {angle}, saving without encoding")
                processed.append((img_array, None, angle))
                continue
            distance = face_rec.face_distance([front_encoding], encodings[0])[0]
            if distance > IDENTITY_TOLERANCE:
                raise ValueError(
                    f"The {angle} photo appears to be a different person. "
                    f"Please ensure only your face is visible in all angles."
                )
            processed.append((img_array, encodings[0], angle))
        except ValueError:
            raise
        except Exception as e:
            logger.warning(f"Could not validate angle {angle}: {e}")
            try:
                processed.append((_preprocess_image(img_bytes), None, angle))
            except Exception:
                pass
    
    # -- All validated: remove old photos and save new ones --
    old_photos = db.query(FacePhoto).filter(
        FacePhoto.employee_id == employee_id,
        FacePhoto.day_slot == 0,
    ).all()
    for photo in old_photos:
        old_path = os.path.join(UPLOAD_DIR, photo.file_path)
        if os.path.exists(old_path):
            os.remove(old_path)
    db.query(FacePhoto).filter(
        FacePhoto.employee_id == employee_id,
        FacePhoto.day_slot == 0,
    ).delete()
    db.commit()

    invalidate_cache(employee_id)

    # Save all photos using cached encodings (no re-encoding!)
    saved_paths = []
    for image_array, encoding, angle_label in processed:
        if encoding is None:
            # No face detected for this angle — still save the image but skip encoding
            safe_filename = f"{employee_id}_{angle_label}_{uuid.uuid4().hex[:8]}.jpg"
            file_path = os.path.join(UPLOAD_DIR, safe_filename)
            Image.fromarray(image_array).save(file_path, "JPEG", quality=85)
            photo = FacePhoto(
                employee_id=employee_id,
                file_path=safe_filename,
                is_primary=False,
                face_encoding=None,
                angle_label=angle_label,
                capture_date=date.today().isoformat(),
                day_slot=0,
            )
            db.add(photo)
            saved_paths.append(safe_filename)
            continue
        try:
            path = _save_face_photo(db, employee_id, image_array, encoding, angle_label)
            saved_paths.append(path)
        except Exception as e:
            logger.warning(f"Skipping angle {angle_label}: {e}")
            continue

    db.commit()

    if not saved_paths:
        raise ValueError("No faces detected in any of the uploaded images")

    return saved_paths


def daily_face_update(db: Session, employee_id: uuid.UUID, image_bytes: bytes) -> bool:
    """Update daily rolling face data for an employee.
    Called when kiosk matches a face - saves today's capture for rolling training.
    Keeps only ROLLING_WINDOW_DAYS days of captures.
    
    Returns True if a new daily capture was saved.
    """
    face_rec = _get_face_recognition()
    today = date.today().isoformat()

    # Check if already captured today
    existing_today = db.query(FacePhoto).filter(
        FacePhoto.employee_id == employee_id,
        FacePhoto.capture_date == today,
        FacePhoto.angle_label == "daily_capture",
    ).first()

    if existing_today:
        return False  # Already captured today

    try:
        image_array = _preprocess_image(image_bytes)
        encodings = face_rec.face_encodings(image_array)
        if not encodings:
            return False

        # Determine day slot: find oldest and assign
        daily_photos = db.query(FacePhoto).filter(
            FacePhoto.employee_id == employee_id,
            FacePhoto.angle_label == "daily_capture",
        ).order_by(FacePhoto.capture_date.asc()).all()

        if len(daily_photos) >= ROLLING_WINDOW_DAYS:
            # Remove oldest daily capture(s) to make room
            photos_to_remove = daily_photos[:len(daily_photos) - ROLLING_WINDOW_DAYS + 1]
            for old_photo in photos_to_remove:
                old_path = os.path.join(UPLOAD_DIR, old_photo.file_path)
                if os.path.exists(old_path):
                    os.remove(old_path)
                db.delete(old_photo)

        # Reassign day slots sequentially
        remaining = db.query(FacePhoto).filter(
            FacePhoto.employee_id == employee_id,
            FacePhoto.angle_label == "daily_capture",
        ).order_by(FacePhoto.capture_date.asc()).all()

        for i, photo in enumerate(remaining):
            photo.day_slot = i + 1

        # Save new daily capture
        next_slot = len(remaining) + 1
        safe_filename = f"{employee_id}_daily_{today}_{uuid.uuid4().hex[:6]}.jpg"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        normalized_img = Image.fromarray(image_array)
        normalized_img.save(file_path, "JPEG", quality=90)

        photo = FacePhoto(
            employee_id=employee_id,
            file_path=safe_filename,
            is_primary=False,
            face_encoding=json.dumps(encodings[0].tolist()),
            angle_label="daily_capture",
            capture_date=today,
            day_slot=next_slot,
        )
        db.add(photo)
        db.commit()

        # Update cache with new encoding
        if employee_id in _encoding_cache:
            existing_encodings, name, code = _encoding_cache[employee_id]
            existing_encodings.append(encodings[0])
            _encoding_cache[employee_id] = (existing_encodings, name, code)

        logger.info(f"Daily face update for employee {employee_id}, slot {next_slot}")
        return True

    except Exception as e:
        logger.warning(f"Failed daily face update for {employee_id}: {e}")
        db.rollback()
        return False


def _match_against_cache(encoding: np.ndarray) -> Tuple[Optional[uuid.UUID], float, str, str]:
    """Match a single face encoding against the cache using ensemble matching.
    
    For each employee with multiple encodings, compute the minimum distance
    (best match) across all their stored encodings.
    
    Returns: (employee_id, confidence, name, employee_code) or (None, 0, '', '')
    """
    if not _encoding_cache:
        return None, 0.0, '', ''

    face_rec = _get_face_recognition()
    best_emp_id = None
    best_confidence = 0.0
    best_name = ''
    best_code = ''

    for emp_id, (encodings, name, emp_code) in _encoding_cache.items():
        # Compute distance against ALL encodings for this employee
        distances = face_rec.face_distance(encodings, encoding)
        min_distance = float(np.min(distances))
        confidence = 1.0 - min_distance

        if confidence > best_confidence:
            best_confidence = confidence
            best_emp_id = emp_id
            best_name = name
            best_code = emp_code

    if best_confidence >= MIN_CONFIDENCE:
        return best_emp_id, best_confidence, best_name, best_code

    return None, best_confidence, '', ''


def detect_and_match(db: Session, image_bytes: bytes) -> list[dict]:
    """Detect and match faces in an image."""
    face_rec = _get_face_recognition()
    _load_encodings(db)
    if not _encoding_cache:
        return []

    image_array = _preprocess_image(image_bytes, max_dimension=640)
    face_locations = face_rec.face_locations(image_array, model="hog", number_of_times_to_upsample=1)
    if not face_locations:
        return []

    face_encodings = face_rec.face_encodings(image_array, face_locations)

    results = []
    for i, encoding in enumerate(face_encodings):
        emp_id, confidence, name, emp_code = _match_against_cache(encoding)
        if emp_id is not None:
            top, right, bottom, left = face_locations[i]
            results.append({
                "employee_id": str(emp_id),
                "employee_code": emp_code,
                "name": name,
                "confidence": round(confidence, 4),
                "bounding_box": {"top": top, "right": right, "bottom": bottom, "left": left},
            })
    return results


def detect_and_match_all(db: Session, image_bytes: bytes) -> tuple[list[dict], list[dict]]:
    """Detect all faces and classify as matched or unmatched.
    Uses ensemble matching for higher accuracy.
    """
    face_rec = _get_face_recognition()
    _load_encodings(db)

    # Use smaller image (640px) for fast kiosk detection
    image_array = _preprocess_image(image_bytes, max_dimension=640)
    img_height, img_width = image_array.shape[:2]

    # Single pass with upsample=1 for speed — skip slow upsample=2 retry
    face_locations = face_rec.face_locations(image_array, model="hog", number_of_times_to_upsample=1)
    if not face_locations:
        return [], []

    face_encodings = face_rec.face_encodings(image_array, face_locations)

    if not _encoding_cache:
        unmatched = []
        for loc in face_locations:
            top, right, bottom, left = loc
            unmatched.append({
                "bounding_box": {"top": top, "right": right, "bottom": bottom, "left": left},
                "image_width": img_width, "image_height": img_height,
            })
        return [], unmatched

    matched, unmatched = [], []
    matched_emp_ids = set()  # Prevent duplicate matches

    for i, encoding in enumerate(face_encodings):
        top, right, bottom, left = face_locations[i]
        emp_id, confidence, name, emp_code = _match_against_cache(encoding)

        if emp_id is not None and emp_id not in matched_emp_ids:
            matched_emp_ids.add(emp_id)
            matched.append({
                "employee_id": str(emp_id),
                "employee_code": emp_code,
                "name": name,
                "confidence": round(confidence, 4),
                "bounding_box": {"top": top, "right": right, "bottom": bottom, "left": left},
                "image_width": img_width, "image_height": img_height,
            })
        else:
            unmatched.append({
                "bounding_box": {"top": top, "right": right, "bottom": bottom, "left": left},
                "image_width": img_width, "image_height": img_height,
            })

    return matched, unmatched


def _get_local_now() -> datetime:
    tz = ZoneInfo(settings.timezone)
    return datetime.now(tz)


def mark_log_by_face(db: Session, employee_id: uuid.UUID, confidence: float) -> dict:
    """Handle kiosk face detection:
    - First detection today -> check_in
    - Already checked in (no checkout) -> already_in (needs user decision)
    - Already checked out -> already_out (ask if they want to check in again)
    """
    local_now = _get_local_now()
    utc_now = datetime.now(timezone.utc)
    today = local_now.strftime("%Y-%m-%d")

    existing = db.query(CheckLog).filter(
        CheckLog.employee_id == employee_id,
        CheckLog.date == today,
    ).order_by(CheckLog.created_at.desc()).first()

    if existing is None:
        record = CheckLog(
            employee_id=employee_id,
            date=today,
            check_in=utc_now,
            verification_method="face",
            face_confidence=confidence,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return {"action": "check_in", "record_id": str(record.id)}

    if existing.check_out is None:
        return {"action": "already_in", "record_id": str(existing.id)}

    # Already checked out today - return already_out instead of auto check-in
    return {"action": "already_out", "record_id": str(existing.id)}


def kiosk_checkout(db: Session, employee_id: uuid.UUID) -> dict:
    """Check out an employee from kiosk."""
    local_now = _get_local_now()
    utc_now = datetime.now(timezone.utc)
    today = local_now.strftime("%Y-%m-%d")

    record = db.query(CheckLog).filter(
        CheckLog.employee_id == employee_id,
        CheckLog.date == today,
        CheckLog.check_out.is_(None),
    ).order_by(CheckLog.created_at.desc()).first()

    if not record:
        return {"action": "no_active_checkin", "record_id": None}

    record.check_out = utc_now
    db.commit()
    return {"action": "check_out", "record_id": str(record.id)}


def kiosk_continue(db: Session, employee_id: uuid.UUID) -> dict:
    """Log a 'continue' action (user chose to stay)."""
    return {"action": "continue"}
