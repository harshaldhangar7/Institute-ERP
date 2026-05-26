import uuid
from datetime import datetime

from sqlalchemy import String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MockInterview(Base):
    __tablename__ = "mock_interviews"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    studentId: Mapped[str] = mapped_column(String, ForeignKey("students.id"), nullable=False)
    trainerId: Mapped[str] = mapped_column(String, ForeignKey("trainers.id"), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    communication: Mapped[float | None] = mapped_column(Float, nullable=True)
    technical: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    overallScore: Mapped[float | None] = mapped_column(Float, nullable=True)
    feedback: Mapped[str | None] = mapped_column(String, nullable=True)

    student = relationship("Student", back_populates="mockInterviews")
    trainer = relationship("Trainer", back_populates="mockInterviews")
