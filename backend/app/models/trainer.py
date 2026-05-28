import uuid

from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Trainer(Base):
    __tablename__ = "trainers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId: Mapped[str] = mapped_column(String, ForeignKey("users.id"), unique=True, nullable=False)
    specialization: Mapped[str | None] = mapped_column(String, nullable=True)

    user = relationship("User", back_populates="trainer")
    trainerBatches = relationship("TrainerBatch", back_populates="trainer")
    lectures = relationship("Lecture", back_populates="trainer")
    mockInterviews = relationship("MockInterview", back_populates="trainer")
    assignments = relationship("Assignment", back_populates="trainer")
    resources = relationship("Resource", back_populates="trainer")
