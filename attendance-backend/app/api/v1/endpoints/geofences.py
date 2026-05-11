import uuid
import math
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.base import get_db
from app.models import Geofence
from app.schemas import GeofenceCreate, GeofenceUpdate, GeofenceResponse, GeofenceCheckRequest, GeofenceCheckResponse
from app.services.audit import create_audit_log

router = APIRouter(prefix="/geofences", tags=["Geofences"])


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@router.get("", response_model=List[GeofenceResponse])
def list_geofences(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return db.query(Geofence).filter(Geofence.is_active == True).all()


@router.post("", response_model=GeofenceResponse, status_code=status.HTTP_201_CREATED)
def create_geofence(
    payload: GeofenceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    geofence = Geofence(**payload.model_dump())
    db.add(geofence)
    db.commit()
    db.refresh(geofence)
    create_audit_log(db, current_user, "create", "geofence", str(geofence.id), f"Created geofence {geofence.name}")
    return geofence


@router.put("/{geofence_id}", response_model=GeofenceResponse)
def update_geofence(
    geofence_id: uuid.UUID,
    payload: GeofenceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    geofence = db.query(Geofence).filter(Geofence.id == geofence_id).first()
    if not geofence:
        raise HTTPException(status_code=404, detail="Geofence not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(geofence, field, value)

    db.commit()
    db.refresh(geofence)
    create_audit_log(db, current_user, "update", "geofence", str(geofence.id), f"Updated geofence {geofence.name}")
    return geofence


@router.delete("/{geofence_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_geofence(
    geofence_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    geofence = db.query(Geofence).filter(Geofence.id == geofence_id).first()
    if not geofence:
        raise HTTPException(status_code=404, detail="Geofence not found")
    geofence.is_active = False
    db.commit()
    create_audit_log(db, current_user, "delete", "geofence", str(geofence.id), f"Deleted geofence {geofence.name}")


@router.post("/check", response_model=GeofenceCheckResponse)
def check_geofence(
    payload: GeofenceCheckRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Check if the given coordinates are inside any active geofence."""
    geofences = db.query(Geofence).filter(Geofence.is_active == True).all()

    if not geofences:
        return GeofenceCheckResponse(inside=True, message="No geofences configured")

    for gf in geofences:
        distance = _haversine(payload.lat, payload.lng, gf.center_lat, gf.center_lng)
        if distance <= gf.radius_meters:
            return GeofenceCheckResponse(inside=True, message=f"Inside {gf.name}")

    return GeofenceCheckResponse(inside=False, message="You are outside the designated office area")
