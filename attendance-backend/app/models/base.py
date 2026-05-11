import uuid
import json
from typing import Optional
from datetime import datetime, timezone

from sqlalchemy import DateTime, Boolean, String, Text, TypeDecorator
from sqlalchemy.orm import Mapped, mapped_column


class GUID(TypeDecorator):
    """Platform-independent UUID type. Uses String(36) for SQLite, native UUID for PostgreSQL."""
    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return str(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return uuid.UUID(value)
        return value


class JSONType(TypeDecorator):
    """Platform-independent JSON type. Uses Text with JSON serialization."""
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value)
        return value


class BaseMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        primary_key=True,
        default=uuid.uuid4,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class TimestampMixin(BaseMixin):
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class SoftDeleteMixin:
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), default=None, nullable=True
    )
