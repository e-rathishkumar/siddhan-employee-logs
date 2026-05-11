import uuid
from typing import Optional
from datetime import datetime

from sqlalchemy import String, ForeignKey, DateTime
from app.models.base import GUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, SoftDeleteMixin


class Employee(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "employees"

    employee_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    designation: Mapped[str] = mapped_column(String(100), nullable=False)
    gender: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # male, female, other
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    avatar_glb_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    user = relationship("User", back_populates="employee", lazy="noload")
    face_photos = relationship("FacePhoto", back_populates="employee", lazy="selectin")
    check_logs = relationship("CheckLog", back_populates="employee", lazy="noload")

    def __repr__(self) -> str:
        return f"<Employee(name={self.name}, emp_id={self.employee_id})>"
