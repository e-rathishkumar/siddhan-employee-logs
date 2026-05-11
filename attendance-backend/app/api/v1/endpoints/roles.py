import uuid
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_admin_user
from app.db.base import get_db
from app.models import Role
from app.schemas import RoleCreate, RoleUpdate, RoleResponse
from app.services.audit import create_audit_log

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("", response_model=List[RoleResponse])
def list_roles(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return db.query(Role).all()


@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    payload: RoleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_admin_user),
):
    if db.query(Role).filter(Role.name == payload.name).first():
        raise HTTPException(status_code=400, detail="Role name already exists")
    role = Role(**payload.model_dump())
    db.add(role)
    db.commit()
    db.refresh(role)
    create_audit_log(db, current_user, "create", "role", str(role.id), f"Created role {role.name}")
    return role


@router.put("/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: uuid.UUID,
    payload: RoleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_admin_user),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(role, field, value)

    db.commit()
    db.refresh(role)
    create_audit_log(db, current_user, "update", "role", str(role.id), f"Updated role {role.name}")
    return role


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_admin_user),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    if role.name in ("admin", "employee", "manager"):
        raise HTTPException(status_code=400, detail="Cannot delete system roles")
    role.is_active = False
    db.commit()
    create_audit_log(db, current_user, "delete", "role", str(role.id), f"Deleted role {role.name}")


@router.patch("/{role_id}/activate")
def activate_role(
    role_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_admin_user),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    role.is_active = True
    db.commit()
    create_audit_log(db, current_user, "activate", "role", str(role.id), f"Activated role {role.name}")
    return {"message": "Role activated"}


@router.patch("/{role_id}/deactivate")
def deactivate_role(
    role_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_admin_user),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    if role.name in ("admin", "employee"):
        raise HTTPException(status_code=400, detail="Cannot deactivate system roles")
    role.is_active = False
    db.commit()
    create_audit_log(db, current_user, "deactivate", "role", str(role.id), f"Deactivated role {role.name}")
    return {"message": "Role deactivated"}
