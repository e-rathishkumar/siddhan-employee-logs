import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.deps import get_current_user, get_admin_user
from app.core.config import get_settings
from app.core.security import hash_password
from app.db.base import get_db
from app.models import User
from app.schemas import (
    UserCreate,
    UserUpdate,
    UserResponse,
    ResetPasswordRequest,
    PaginatedResponse,
)
from app.services.audit import create_audit_log

settings = get_settings()

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=PaginatedResponse)
def list_users(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_admin_user),
):
    query = db.query(User)
    if search:
        query = query.filter(
            or_(
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    users = query.offset((page - 1) * pageSize).limit(pageSize).all()

    return PaginatedResponse(
        data=[UserResponse.model_validate(u).model_dump() for u in users],
        total=total,
        page=page,
        pageSize=pageSize,
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_admin_user),
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        name=payload.name,
        hashed_password=hash_password(payload.password),
        phone=payload.phone,
        role_id=payload.role_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    create_audit_log(db, current_user, "create", "user", str(user.id), f"Created user {user.name}")
    return UserResponse.model_validate(user)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_admin_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    create_audit_log(db, current_user, "update", "user", str(user.id), f"Updated user {user.name}")
    return UserResponse.model_validate(user)


@router.patch("/{user_id}", response_model=UserResponse)
def patch_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_admin_user),
):
    return update_user(user_id, payload, db, current_user)


@router.patch("/{user_id}/activate")
def activate_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_admin_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    db.commit()
    create_audit_log(db, current_user, "activate", "user", str(user.id), f"Activated user {user.name}")
    return {"message": "User activated"}


@router.patch("/{user_id}/deactivate")
def deactivate_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_admin_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    user.is_active = False
    db.commit()
    create_audit_log(db, current_user, "deactivate", "user", str(user.id), f"Deactivated user {user.name}")
    return {"message": "User deactivated"}


@router.post("/{user_id}/reset-password")
def reset_password(
    user_id: uuid.UUID,
    payload: Optional[ResetPasswordRequest] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_admin_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    new_pw = payload.new_password if payload else settings.default_admin_password
    user.hashed_password = hash_password(new_pw)
    user.is_new_user = True
    db.commit()
    create_audit_log(db, current_user, "reset_password", "user", str(user.id), f"Reset password for {user.name}")
    return {"message": "Password reset successfully"}
