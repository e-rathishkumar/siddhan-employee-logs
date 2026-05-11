import uuid
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field


# --- Pagination ---
class PaginatedResponse(BaseModel):
    data: List[Any]
    total: int
    page: int
    page_size: int = Field(alias="pageSize")

    model_config = {"populate_by_name": True}


# --- Auth ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class RefreshRequest(BaseModel):
    refresh_token: str


# --- Role ---
class RoleBase(BaseModel):
    name: str
    description: str = ""
    permissions: List[str] = []


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None


class RoleResponse(RoleBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- User ---
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role_id: uuid.UUID


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    role_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    phone: Optional[str] = None
    role_id: uuid.UUID
    role: Optional[RoleResponse] = None
    is_active: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ResetPasswordRequest(BaseModel):
    new_password: str = Field(min_length=8)


# --- Employee ---
class EmployeeBase(BaseModel):
    employee_id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: str
    gender: Optional[str] = None
    joined_at: datetime


class EmployeeCreate(EmployeeBase):
    password: str = Field(default="Sidd@123", min_length=8)


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    gender: Optional[str] = None


class FacePhotoResponse(BaseModel):
    id: uuid.UUID
    url: str
    is_primary: bool = False
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class EmployeeResponse(BaseModel):
    id: uuid.UUID
    employee_id: str
    name: str
    email: str
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: str
    gender: Optional[str] = None
    joined_at: datetime
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Check Log ---
class CheckLogResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    date: str
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    verification_method: str
    face_confidence: Optional[float] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Geofence ---
class GeofenceBase(BaseModel):
    name: str
    address: Optional[str] = None
    center_lat: float
    center_lng: float
    radius_meters: float


class GeofenceCreate(GeofenceBase):
    pass


class GeofenceUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    center_lat: Optional[float] = None
    center_lng: Optional[float] = None
    radius_meters: Optional[float] = None


class GeofenceResponse(GeofenceBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Audit Log ---
class AuditLogResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    user_name: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    changes: Optional[dict] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Mobile Employee APIs ---
class CheckInRequest(BaseModel):
    lat: float
    lng: float


class CheckOutRequest(BaseModel):
    pass


class GeofenceCheckRequest(BaseModel):
    lat: float
    lng: float


class GeofenceCheckResponse(BaseModel):
    inside: bool
    message: str


class EmployeeLoginResponse(BaseModel):
    id: uuid.UUID
    employee_id: str
    name: str
    email: str
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: str
    gender: Optional[str] = None
    joined_at: datetime
    is_active: bool
    face_registered: bool = False
    is_new_user: bool = True

    model_config = {"from_attributes": True}


class EmployeeTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: EmployeeLoginResponse


# --- Dashboard ---
class DashboardSummary(BaseModel):
    total_employees: int
    checked_in_today: int
    checked_out_today: int
    still_inside: int
    recent_logs: List[dict]


class EmployeeDashboardSummary(BaseModel):
    employee_name: str
    employee_id: str
    checked_in: bool = False
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    recent_activity: List[dict] = []
    profile_photo_url: Optional[str] = None
    present_days: int = 0
    absent_days: int = 0
    late_days: int = 0
    present_dates: List[str] = []
    absent_dates: List[str] = []
    late_dates: List[str] = []


# Forward reference update
TokenResponse.model_rebuild()
