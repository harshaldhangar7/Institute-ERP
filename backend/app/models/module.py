import uuid

from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)

    batchModules = relationship("BatchModule", back_populates="module")
    lectures = relationship("Lecture", back_populates="module")
    marks = relationship("Marks", back_populates="module")
    assignments = relationship("Assignment", back_populates="module")
    resources = relationship("Resource", back_populates="module")
