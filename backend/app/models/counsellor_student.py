import uuid

from sqlalchemy import String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CounsellorStudent(Base):
    __tablename__ = "counsellor_students"
    __table_args__ = (UniqueConstraint("counsellorId", "studentId"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    counsellorId: Mapped[str] = mapped_column(String, ForeignKey("counsellors.id"), nullable=False)
    studentId: Mapped[str] = mapped_column(String, nullable=False)

    counsellor = relationship("Counsellor", back_populates="counsellorStudents")
