import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Batch(Base):
    __tablename__ = "batches"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    startDate: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    endDate: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    isActive: Mapped[bool] = mapped_column(Boolean, default=True)

    students = relationship("Student", back_populates="batch")
    batchModules = relationship("BatchModule", back_populates="batch")
    trainerBatches = relationship("TrainerBatch", back_populates="batch")
    lectures = relationship("Lecture", back_populates="batch")
    assignments = relationship("Assignment", back_populates="batch")
    announcements = relationship("Announcement", back_populates="batch")
