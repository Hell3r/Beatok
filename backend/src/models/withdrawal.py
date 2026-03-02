from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum, Numeric, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional
import enum
from src.database.database import Base
from decimal import Decimal


class WithdrawalStatus(enum.Enum):
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    EXPIRED = "expired"



class WithdrawalModel(Base):
    __tablename__ = "withdrawals"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    status: Mapped[WithdrawalStatus] = mapped_column(Enum(WithdrawalStatus), default=WithdrawalStatus.PENDING)
    card_number: Mapped[str] = mapped_column(String(500))
    description: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), index=True)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    
    
    user: Mapped["UsersModel"] = relationship("UsersModel", back_populates="withdrawals")