from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.security import (
    verify_password,
    hash_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.deps import get_current_user
from app.db.base import get_db
from app.models.user import User
from app.models import Employee
from app.schemas import LoginRequest, TokenResponse, RefreshRequest, UserResponse, EmployeeTokenResponse, EmployeeLoginResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


class UpdatePasswordRequest(BaseModel):
    new_password: str = Field(min_length=8)
    confirm_password: str = Field(min_length=8)


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is deactivated. Contact the admin.",
        )

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.name if user.role else "user",
        "name": user.name,
        "is_new_user": user.is_new_user,
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Check if user has an employee record
    emp = db.query(Employee).filter(Employee.user_id == user.id, Employee.is_active == True).first()
    if emp:
        return EmployeeTokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=EmployeeLoginResponse(
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
                face_registered=len(emp.face_photos) > 0 if emp.face_photos else False,
                is_new_user=user.is_new_user,
            ),
        )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    token_payload = decode_token(payload.refresh_token)
    if not token_payload or token_payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = token_payload.get("sub")
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.name if user.role else "user",
        "name": user.name,
        "is_new_user": user.is_new_user,
    }
    access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/update-password")
def update_password(
    payload: UpdatePasswordRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update password for the current user. Sets is_new_user to false."""
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )

    current_user.hashed_password = hash_password(payload.new_password)
    current_user.is_new_user = False
    db.commit()
    db.refresh(current_user)

    # Return new tokens with updated is_new_user
    token_data = {
        "sub": str(current_user.id),
        "email": current_user.email,
        "role": current_user.role.name if current_user.role else "user",
        "name": current_user.name,
        "is_new_user": False,
    }
    access_token = create_access_token(token_data)
    refresh_token_str = create_refresh_token(token_data)

    return {
        "message": "Password updated successfully",
        "access_token": access_token,
        "refresh_token": refresh_token_str,
    }
