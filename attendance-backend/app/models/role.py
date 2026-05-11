import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, ForeignKey, DateTime
from app.models.base import GUID, JSONType
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, SoftDeleteMixin


class Role(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    permissions: Mapped[dict] = mapped_column(JSONType(), nullable=False, default=list)

    users = relationship("User", back_populates="role", lazy="noload")

    def __repr__(self) -> str:
        return f"<Role(name={self.name})>"
