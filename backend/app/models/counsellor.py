import uuid

from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Counsellor(Base):
    __tablename__ = "counsellors"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId: Mapped[str] = mapped_column(String, ForeignKey("users.id"), unique=True, nullable=False)

    user = relationship("User", back_populates="counsellor")
    counsellorStudents = relationship("CounsellorStudent", back_populates="counsellor")
    students = relationship("Student", back_populates="counsellor")
