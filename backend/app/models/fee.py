import uuid
from datetime import datetime

from sqlalchemy import String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Fee(Base):
    __tablename__ = "fees"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    studentId: Mapped[str] = mapped_column(String, ForeignKey("students.id"), nullable=False)
    totalAmount: Mapped[float] = mapped_column(Float, nullable=False)
    paidAmount: Mapped[float] = mapped_column(Float, default=0)
    pendingAmount: Mapped[float] = mapped_column(Float, nullable=False)
    dueDate: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String, default="PENDING")

    student = relationship("Student", back_populates="fees")
    payments = relationship("FeePayment", back_populates="fee")


class FeePayment(Base):
    __tablename__ = "fee_payments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    feeId: Mapped[str] = mapped_column(String, ForeignKey("fees.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    paidAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    method: Mapped[str] = mapped_column(String, nullable=False)

    fee = relationship("Fee", back_populates="payments")
