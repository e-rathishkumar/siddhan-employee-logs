import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, ForeignKey, DateTime, Text, Integer
from app.models.base import GUID, JSONType
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin


class FacePhoto(TimestampMixin, Base):
    __tablename__ = "face_photos"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    is_primary: Mapped[bool] = mapped_column(default=False, nullable=False)
    # 128-d face encoding stored as JSON array for consistent matching
    face_encoding: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Angle label for 360° registration: front, left_45, left_90, right_45, right_90, up, down
    # or "daily_capture" for rolling window captures
    angle_label: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="front")
    # Date of capture for rolling window (YYYY-MM-DD)
    capture_date: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    # Day slot for 5-day rolling window (1-5), 0 = permanent registration photo
    day_slot: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    employee = relationship("Employee", back_populates="face_photos")
