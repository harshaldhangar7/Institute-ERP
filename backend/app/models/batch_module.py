import uuid

from sqlalchemy import String, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class BatchModule(Base):
    __tablename__ = "batch_modules"
    __table_args__ = (UniqueConstraint("batchId", "moduleId"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    batchId: Mapped[str] = mapped_column(String, ForeignKey("batches.id"), nullable=False)
    moduleId: Mapped[str] = mapped_column(String, ForeignKey("modules.id"), nullable=False)
    trainerId: Mapped[str | None] = mapped_column(String, ForeignKey("trainers.id"), nullable=True)
    status: Mapped[str] = mapped_column(String, default="PENDING")
    completionPercent: Mapped[float] = mapped_column(Float, default=0)

    batch = relationship("Batch", back_populates="batchModules")
    module = relationship("Module", back_populates="batchModules")
    trainer = relationship("Trainer")
