import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Announcement(Base):
    __tablename__ = "announcements"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    createdById: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    message: Mapped[str] = mapped_column(String, nullable=False)
    targetRole: Mapped[str | None] = mapped_column(String, nullable=True)
    batchId: Mapped[str | None] = mapped_column(String, ForeignKey("batches.id"), nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    createdBy = relationship("User", back_populates="announcements")
    batch = relationship("Batch", back_populates="announcements")
