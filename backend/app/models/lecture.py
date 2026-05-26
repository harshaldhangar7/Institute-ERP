import uuid
from datetime import datetime

from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Lecture(Base):
    __tablename__ = "lectures"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    batchId: Mapped[str] = mapped_column(String, ForeignKey("batches.id"), nullable=False)
    moduleId: Mapped[str] = mapped_column(String, ForeignKey("modules.id"), nullable=False)
    trainerId: Mapped[str] = mapped_column(String, ForeignKey("trainers.id"), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    startTime: Mapped[str] = mapped_column(String, nullable=False)
    endTime: Mapped[str] = mapped_column(String, nullable=False)
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)
    topics: Mapped[str | None] = mapped_column(String, nullable=True)
    sessionToken: Mapped[str | None] = mapped_column(String, nullable=True)

    batch = relationship("Batch", back_populates="lectures")
    module = relationship("Module", back_populates="lectures")
    trainer = relationship("Trainer", back_populates="lectures")
    attendances = relationship("Attendance", back_populates="lecture")
