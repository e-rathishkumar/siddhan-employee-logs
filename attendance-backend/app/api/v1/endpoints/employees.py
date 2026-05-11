import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from app.core.deps import get_current_user
from app.db.base import get_db
from app.models import Employee, User
from app.core.security import hash_password
from app.schemas import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    PaginatedResponse,
)
from app.services.audit import create_audit_log

router = APIRouter(prefix="/employees", tags=["Employees"])


def _to_response(emp: Employee) -> EmployeeResponse:
    return EmployeeResponse(
        id=emp.id,
        employee_id=emp.employee_id,
        name=emp.name,
        email=emp.email,
        phone=emp.phone,
        department=emp.department,
        designation=emp.designation,
        gender=emp.gender,
        joined_at=emp.joined_at,
        is_active=emp.is_active,
        created_at=emp.created_at,
        updated_at=emp.updated_at,
    )


@router.get("/me")
def get_my_profile(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id, Employee.is_active == True).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    resp = _to_response(emp)
    resp_dict = resp.model_dump()
    resp_dict['is_new_user'] = current_user.is_new_user
    face_photos = []
    profile_photo_url = None
    if emp.face_photos:
        primary = next((p for p in emp.face_photos if p.is_primary), None)
        for p in emp.face_photos:
            face_photos.append({
                'id': str(p.id),
                'url': f'/uploads/faces/{p.file_path}',
                'is_primary': p.is_primary,
            })
        if primary:
            profile_photo_url = f'/uploads/faces/{primary.file_path}'
        else:
            profile_photo_url = f'/uploads/faces/{emp.face_photos[0].file_path}'
    resp_dict['face_photos'] = face_photos
    resp_dict['profile_photo_url'] = profile_photo_url
    resp_dict['face_registered'] = bool(emp.face_photos)
    return resp_dict


@router.get("", response_model=PaginatedResponse)
def list_employees(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Employee)
    if search:
        query = query.filter(
            or_(
                Employee.name.ilike(f"%{search}%"),
                Employee.email.ilike(f"%{search}%"),
                Employee.employee_id.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    employees = query.offset((page - 1) * pageSize).limit(pageSize).all()
    data = [_to_response(e).model_dump() for e in employees]
    return PaginatedResponse(data=data, total=total, page=page, pageSize=pageSize)


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return _to_response(emp)


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.models import Role
    employee_role = db.query(Role).filter(Role.name == "employee").first()
    if not employee_role:
        employee_role = db.query(Role).first()

    user = User(
        email=payload.email,
        name=payload.name,
        hashed_password=hash_password(payload.password),
        phone=payload.phone,
        role_id=employee_role.id,
        is_new_user=True,
    )
    db.add(user)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already exists")

    emp = Employee(
        employee_id=payload.employee_id,
        user_id=user.id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        department=payload.department,
        designation=payload.designation,
        gender=payload.gender,
        joined_at=payload.joined_at,
    )
    db.add(emp)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    db.refresh(emp)
    create_audit_log(db, current_user, "create", "employee", str(emp.id), f"Created employee {emp.name}")
    return _to_response(emp)


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: uuid.UUID,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(emp, field, value)

    db.commit()
    db.refresh(emp)
    create_audit_log(db, current_user, "update", "employee", str(emp.id), f"Updated employee {emp.name}")
    return _to_response(emp)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    emp.is_active = False
    user = db.query(User).filter(User.id == emp.user_id).first()
    if user:
        user.is_active = False
    db.commit()
    create_audit_log(db, current_user, "delete", "employee", str(emp.id), f"Deactivated employee {emp.name}")


@router.patch("/{employee_id}/activate")
def activate_employee(
    employee_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    emp.is_active = True
    user = db.query(User).filter(User.id == emp.user_id).first()
    if user:
        user.is_active = True
    db.commit()
    create_audit_log(db, current_user, "activate", "employee", str(emp.id), f"Activated employee {emp.name}")
    return {"message": "Employee activated"}


@router.delete("/{employee_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
def permanently_delete_employee(
    employee_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.models import FacePhoto, CheckLog, KioskLog
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    emp_name = emp.name
    user_id = emp.user_id
    # Delete related records
    db.query(KioskLog).filter(KioskLog.employee_id == emp.id).delete()
    db.query(FacePhoto).filter(FacePhoto.employee_id == emp.id).delete()
    db.query(CheckLog).filter(CheckLog.employee_id == emp.id).delete()
    db.delete(emp)
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)
    db.commit()
    create_audit_log(db, current_user, "permanent_delete", "employee", str(employee_id), f"Permanently deleted employee {emp_name}")
