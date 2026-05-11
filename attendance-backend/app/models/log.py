import uuid
from typing import Optional
from datetime import datetime

from sqlalchemy import String, Float, ForeignKey, DateTime
from app.models.base import GUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin


class CheckLog(TimestampMixin, Base):
    """Simple check-in / check-out log. One row per check-in event;
    check_out is filled when the employee checks out."""
    __tablename__ = "check_logs"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    date: Mapped[str] = mapped_column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    check_in: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    check_out: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verification_method: Mapped[str] = mapped_column(String(20), nullable=False, default="face")  # face, geofence
    face_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    geofence_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(),
        ForeignKey("geofences.id", ondelete="SET NULL"),
        nullable=True,
    )

    employee = relationship("Employee", back_populates="check_logs", lazy="joined")

    def __repr__(self) -> str:
        return f"<CheckLog(employee_id={self.employee_id}, date={self.date})>"
