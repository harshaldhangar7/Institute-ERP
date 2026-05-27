import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    moduleId: Mapped[str] = mapped_column(String, ForeignKey("modules.id"), nullable=False)
    trainerId: Mapped[str] = mapped_column(String, ForeignKey("trainers.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    filePath: Mapped[str | None] = mapped_column(String, nullable=True)
    uploadedAt: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    module = relationship("Module", back_populates="resources")
    trainer = relationship("Trainer", back_populates="resources")
