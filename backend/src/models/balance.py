from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, List
import enum
from src.database.database import Base
from decimal import Decimal

class BalanceOperationType(enum.Enum):
    DEPOSIT = "deposit"           # Пополнение
    WITHDRAWAL = "withdrawal"     # Вывод
    PURCHASE = "purchase"         # Покупка
    REFUND = "refund"             # Возврат
    BONUS = "bonus"               # Бонус за промокод

class UserBalanceModel(Base):
    __tablename__ = "user_balance_operations"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    operation_type: Mapped[BalanceOperationType] = mapped_column(Enum(BalanceOperationType))
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    balance_before: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    balance_after: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    description: Mapped[Optional[str]] = mapped_column(String(500))
    reference_id: Mapped[Optional[int]] = mapped_column(Integer)  # ID платежа, покупки, промокода
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), index=True)
    
    # Связи
    user: Mapped["UsersModel"] = relationship("UsersModel", back_populates="balance_operations")