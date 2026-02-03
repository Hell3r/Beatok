from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional
import enum
from src.database.database import Base
from decimal import Decimal

class PaymentStatus(enum.Enum):
    PENDING = "pending"
    WAITING_FOR_CAPTURE = "waiting_for_capture"
    SUCCEEDED = "succeeded"
    CANCELED = "canceled"
    FAILED = "failed"

class PaymentModel(Base):
    __tablename__ = "payments"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    external_payment_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True, index=True)
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    description: Mapped[Optional[str]] = mapped_column(String(500))
    
    # Данные платежа
    payment_url: Mapped[Optional[str]] = mapped_column(Text)
    payment_method: Mapped[Optional[str]] = mapped_column(String(50))
    
    # Даты
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), index=True)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    expired_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    
    # Связи
    user: Mapped["UsersModel"] = relationship("UsersModel", back_populates="payments")
    