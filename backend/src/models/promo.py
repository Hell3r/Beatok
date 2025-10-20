from sqlalchemy import String, Integer, DateTime, Boolean, Float, Text, ForeignKey, Enum, JSON, DECIMAL
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from typing import Optional, List
from src.database.database import Base

class PromoType(enum.Enum):
    BALANCE = "balance"   
    DISCOUNT = "discount"  
    PERCENT = "percent"   

class PromoStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPIRED = "expired"

class UserPromoStatus(enum.Enum):
    ACTIVE = "active"     
    APPLIED = "applied"     
    EXPIRED = "expired"    

class PurchaseStatus(enum.Enum):
    PENDING = "pending"     
    COMPLETED = "completed" 
    CANCELLED = "cancelled" 

class PromoCodeModel(Base):
    __tablename__ = "promo_codes"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    

    promo_type: Mapped[PromoType] = mapped_column(Enum(PromoType), nullable=False)
    

    value: Mapped[float] = mapped_column(Float, nullable=False)

    max_uses: Mapped[int] = mapped_column(Integer, default=1)
    used_count: Mapped[int] = mapped_column(Integer, default=0)
    max_uses_per_user: Mapped[int] = mapped_column(Integer, default=1)
    

    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False,)
    

    min_purchase_amount: Mapped[float] = mapped_column(Float, default=0)
    

    allowed_user_ids: Mapped[Optional[List[int]]] = mapped_column(JSON, nullable=True)
    

    status: Mapped[PromoStatus] = mapped_column(Enum(PromoStatus), default=PromoStatus.ACTIVE)
    

    total_discount_amount: Mapped[float] = mapped_column(Float, default=0)
    total_purchases: Mapped[int] = mapped_column(Integer, default=0)
    

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())
    

    user_promos: Mapped[List["UserPromoCodeModel"]] = relationship("UserPromoCodeModel", back_populates="promo_code")
    usages: Mapped[List["PromoCodeUsageModel"]] = relationship("PromoCodeUsageModel", back_populates="promo_code")

class UserPromoCodeModel(Base):
    __tablename__ = "user_promo_codes"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    promo_code_id: Mapped[int] = mapped_column(ForeignKey("promo_codes.id"), nullable=False)
    

    status: Mapped[UserPromoStatus] = mapped_column(Enum(UserPromoStatus), default=UserPromoStatus.ACTIVE)
    

    activated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    applied_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    

    user: Mapped["UsersModel"] = relationship("UsersModel", back_populates="active_promos")
    promo_code: Mapped["PromoCodeModel"] = relationship("PromoCodeModel", back_populates="user_promos")
    usage: Mapped[Optional["PromoCodeUsageModel"]] = relationship("PromoCodeUsageModel", back_populates="user_promo")

class PromoCodeUsageModel(Base):
    __tablename__ = "promo_code_usages"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    promo_code_id: Mapped[int] = mapped_column(ForeignKey("promo_codes.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    user_promo_id: Mapped[Optional[int]] = mapped_column(ForeignKey("user_promo_codes.id"), nullable=True)
    purchase_id: Mapped[Optional[int]] = mapped_column(ForeignKey("purchases.id"), nullable=True)
    

    applied_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    discount_amount: Mapped[float] = mapped_column(Float, default=0)
    purchase_amount: Mapped[float] = mapped_column(Float, default=0)
    final_amount: Mapped[float] = mapped_column(Float, default=0)
    

    promo_code: Mapped["PromoCodeModel"] = relationship("PromoCodeModel", back_populates="usages")
    user: Mapped["UsersModel"] = relationship("UsersModel")
    user_promo: Mapped[Optional["UserPromoCodeModel"]] = relationship("UserPromoCodeModel", back_populates="usage")
    purchase: Mapped[Optional["PurchaseModel"]] = relationship("PurchaseModel", back_populates="promo_usage")