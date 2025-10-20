from sqlalchemy import String, Integer, DateTime, Boolean, Float, ForeignKey, Enum, JSON, DECIMAL
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from src.database.database import Base
from typing import Optional, List

class PurchaseStatus(enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PurchaseModel(Base):
    __tablename__ = "purchases"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    
    # Данные покупки
    total_amount: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    discount_amount: Mapped[float] = mapped_column(DECIMAL(10, 2), default=0)
    final_amount: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    
    # Статус
    status: Mapped[PurchaseStatus] = mapped_column(Enum(PurchaseStatus), default=PurchaseStatus.PENDING)
    
    # Временные метки
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Связи
    user: Mapped["UsersModel"] = relationship("UsersModel", back_populates="purchases")
    items: Mapped[List["PurchaseItemModel"]] = relationship("PurchaseItemModel", back_populates="purchase")
    promo_usage: Mapped[Optional["PromoCodeUsageModel"]] = relationship("PromoCodeUsageModel", back_populates="purchase")

class PurchaseItemModel(Base):
    __tablename__ = "purchase_items"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    purchase_id: Mapped[int] = mapped_column(ForeignKey("purchases.id"), nullable=False)
    beat_id: Mapped[int] = mapped_column(ForeignKey("beats.id"), nullable=False)
    tariff_name: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Цена на момент покупки
    price: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    
    # Связи
    purchase: Mapped["PurchaseModel"] = relationship("PurchaseModel", back_populates="items")
    beat: Mapped["BeatModel"] = relationship("BeatModel")