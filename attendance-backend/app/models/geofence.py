import uuid
from typing import Optional
from datetime import datetime

from sqlalchemy import String, Float, Boolean
from app.models.base import GUID, JSONType
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, SoftDeleteMixin


class Geofence(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "geofences"

    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    center_lat: Mapped[float] = mapped_column(Float, nullable=False)
    center_lng: Mapped[float] = mapped_column(Float, nullable=False)
    radius_meters: Mapped[float] = mapped_column(Float, nullable=False)

    def __repr__(self) -> str:
        return f"<Geofence(name={self.name})>"
