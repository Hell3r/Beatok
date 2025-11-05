# src/models/withdrawal.py
from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional
import enum
from src.database.database import Base
from decimal import Decimal

class WithdrawalStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    REJECTED = "rejected"
    FAILED = "failed"

class WithdrawalModel(Base):
    __tablename__ = "withdrawals"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    # Суммы
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    fee: Mapped[Decimal] = mapped_column(Numeric(10, 2))  # Комиссия
    net_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))  # Сумма к выплате
    
    # Статус
    status: Mapped[WithdrawalStatus] = mapped_column(Enum(WithdrawalStatus), default=WithdrawalStatus.PENDING)
    
    # Данные для выплаты
    card_number: Mapped[str] = mapped_column(String(20))  # Зашифровать на проде!
    cardholder_name: Mapped[Optional[str]] = mapped_column(String(100))
    
    # Даты
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), index=True)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    
    # Комментарии
    admin_notes: Mapped[Optional[str]] = mapped_column(String(500))
    rejection_reason: Mapped[Optional[str]] = mapped_column(String(500))
    
    # Связи
    user: Mapped["UsersModel"] = relationship("UsersModel", back_populates="withdrawals")