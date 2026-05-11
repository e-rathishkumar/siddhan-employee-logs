import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Float, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import BaseMixin, GUID


class KioskLog(BaseMixin, Base):
    """Logs every face detection event from the kiosk."""
    __tablename__ = "kiosk_logs"

    employee_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    action: Mapped[str] = mapped_column(String(30), nullable=False)  # check_in, check_out, continue, already_in
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    employee = relationship("Employee", lazy="joined")

    def __repr__(self) -> str:
        return f"<KioskLog(employee_id={self.employee_id}, action={self.action}, detected_at={self.detected_at})>"
