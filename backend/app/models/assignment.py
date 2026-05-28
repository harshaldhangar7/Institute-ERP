import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    moduleId: Mapped[str] = mapped_column(String, ForeignKey("modules.id"), nullable=False)
    batchId: Mapped[str] = mapped_column(String, ForeignKey("batches.id"), nullable=False)
    trainerId: Mapped[str] = mapped_column(String, ForeignKey("trainers.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    dueDate: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    filePath: Mapped[str | None] = mapped_column(String, nullable=True)

    module = relationship("Module", back_populates="assignments")
    batch = relationship("Batch", back_populates="assignments")
    trainer = relationship("Trainer", back_populates="assignments")
    submissions = relationship("Submission", back_populates="assignment")


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    assignmentId: Mapped[str] = mapped_column(String, ForeignKey("assignments.id"), nullable=False)
    studentId: Mapped[str] = mapped_column(String, ForeignKey("students.id"), nullable=False)
    filePath: Mapped[str | None] = mapped_column(String, nullable=True)
    submittedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    grade: Mapped[str | None] = mapped_column(String, nullable=True)
    feedback: Mapped[str | None] = mapped_column(String, nullable=True)

    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("Student", back_populates="submissions")
