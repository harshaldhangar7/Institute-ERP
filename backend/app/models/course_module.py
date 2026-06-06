import uuid

from sqlalchemy import String, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CourseModule(Base):
    __tablename__ = "course_modules"
    __table_args__ = (UniqueConstraint("courseId", "moduleId"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    courseId: Mapped[str] = mapped_column(String, ForeignKey("courses.id"), nullable=False)
    moduleId: Mapped[str] = mapped_column(String, ForeignKey("modules.id"), nullable=False)
    orderIndex: Mapped[int] = mapped_column(Integer, default=0)  # sequence order in the course

    course = relationship("Course", back_populates="courseModules")
    module = relationship("Module", back_populates="courseModules")
