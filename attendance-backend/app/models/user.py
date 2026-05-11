import uuid
from typing import Optional
from datetime import datetime

from sqlalchemy import String, Boolean, ForeignKey, DateTime
from app.models.base import GUID, JSONType
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, SoftDeleteMixin


class User(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    role_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("roles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    is_new_user: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1", nullable=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    role = relationship("Role", back_populates="users", lazy="joined")
    employee = relationship("Employee", back_populates="user", uselist=False, lazy="noload")

    def __repr__(self) -> str:
        return f"<User(email={self.email})>"
