import uuid

from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Marks(Base):
    __tablename__ = "marks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    studentId: Mapped[str] = mapped_column(String, ForeignKey("students.id"), nullable=False)
    moduleId: Mapped[str] = mapped_column(String, ForeignKey("modules.id"), nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    maxScore: Mapped[float] = mapped_column(Float, nullable=False)
    remarks: Mapped[str | None] = mapped_column(String, nullable=True)

    student = relationship("Student", back_populates="marks")
    module = relationship("Module", back_populates="marks")
