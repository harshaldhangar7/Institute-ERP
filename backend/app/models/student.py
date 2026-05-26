import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId: Mapped[str] = mapped_column(String, ForeignKey("users.id"), unique=True, nullable=False)
    batchId: Mapped[str | None] = mapped_column(String, ForeignKey("batches.id"), nullable=True)
    counsellorId: Mapped[str | None] = mapped_column(String, ForeignKey("counsellors.id"), nullable=True)
    enrollmentDate: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    mode: Mapped[str] = mapped_column(String, default="OFFLINE")

    user = relationship("User", back_populates="student")
    batch = relationship("Batch", back_populates="students")
    counsellor = relationship("Counsellor", back_populates="students")
    attendances = relationship("Attendance", back_populates="student")
    marks = relationship("Marks", back_populates="student")
    mockInterviews = relationship("MockInterview", back_populates="student")
    submissions = relationship("Submission", back_populates="student")
    fees = relationship("Fee", back_populates="student")
