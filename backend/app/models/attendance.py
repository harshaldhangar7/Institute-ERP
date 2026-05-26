import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Attendance(Base):
    __tablename__ = "attendances"
    __table_args__ = (UniqueConstraint("studentId", "lectureId"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    studentId: Mapped[str] = mapped_column(String, ForeignKey("students.id"), nullable=False)
    lectureId: Mapped[str] = mapped_column(String, ForeignKey("lectures.id"), nullable=False)
    status: Mapped[str] = mapped_column(String, default="ABSENT")
    markedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    method: Mapped[str] = mapped_column(String, default="MANUAL")

    student = relationship("Student", back_populates="attendances")
    lecture = relationship("Lecture", back_populates="attendances")
