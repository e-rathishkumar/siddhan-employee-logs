"""Avatar generation endpoints — local trimesh, always synchronous (<200ms)."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.models import Employee
from app.services.avatar_service import (
    generate_avatar_from_photo,
    get_cached_avatar_url,
    regenerate_avatar,
)

router = APIRouter(prefix="/avatar", tags=["Avatar"])


@router.post("/generate/{employee_id}")
async def generate_avatar(
    employee_id: uuid.UUID,
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    """
    Generate a 3D avatar for an employee (local trimesh — <200ms).

    If avatar is already cached, returns instantly.
    Otherwise generates synchronously and returns the URL.
    """
    emp = (
        db.query(Employee)
        .filter(Employee.id == employee_id, Employee.is_active == True)
        .first()
    )
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Fast path: return cached avatar instantly
    if emp.avatar_glb_url:
        return {"avatar_url": emp.avatar_glb_url, "cached": True}

    # If file provided, read bytes (kept for API compat)
    image_bytes = None
    if file is not None:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        image_bytes = await file.read()
        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    # Generate synchronously — local trimesh takes <200ms
    avatar_url = generate_avatar_from_photo(db, str(employee_id), image_bytes)

    if not avatar_url:
        raise HTTPException(status_code=503, detail="Avatar generation failed.")

    return {"avatar_url": avatar_url, "cached": False}


@router.get("/{employee_id}")
def get_avatar(
    employee_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Get the cached avatar URL — instant response."""
    url = get_cached_avatar_url(db, str(employee_id))
    if not url:
        raise HTTPException(status_code=404, detail="No avatar generated yet")
    return {"avatar_url": url}


@router.post("/regenerate/{employee_id}")
def regenerate_avatar_endpoint(
    employee_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Force-regenerate avatar with improved model (e.g. after face re-registration)."""
    avatar_url = regenerate_avatar(db, str(employee_id))
    if not avatar_url:
        raise HTTPException(status_code=503, detail="Avatar regeneration failed.")
    return {"avatar_url": avatar_url, "cached": False}
