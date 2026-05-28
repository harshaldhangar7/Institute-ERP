import uuid

from sqlalchemy import String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TrainerBatch(Base):
    __tablename__ = "trainer_batches"
    __table_args__ = (UniqueConstraint("trainerId", "batchId"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    trainerId: Mapped[str] = mapped_column(String, ForeignKey("trainers.id"), nullable=False)
    batchId: Mapped[str] = mapped_column(String, ForeignKey("batches.id"), nullable=False)

    trainer = relationship("Trainer", back_populates="trainerBatches")
    batch = relationship("Batch", back_populates="trainerBatches")
