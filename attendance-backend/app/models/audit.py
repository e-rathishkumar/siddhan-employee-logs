import uuid
from typing import Optional
from datetime import datetime

from sqlalchemy import String, ForeignKey, DateTime, Text
from app.models.base import GUID, JSONType
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import BaseMixin


class AuditLog(BaseMixin, Base):
    __tablename__ = "audit_logs"

    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID(),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    user_name: Mapped[str] = mapped_column(String(255), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    changes: Mapped[Optional[dict]] = mapped_column(JSONType(), nullable=True)

    user = relationship("User", lazy="noload")

    def __repr__(self) -> str:
        return f"<AuditLog(action={self.action}, entity={self.entity_type})>"
