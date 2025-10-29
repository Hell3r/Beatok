from sqlalchemy import String, Integer, DateTime, Boolean, Float, Text, ForeignKey, JSON, DECIMAL
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, List
from src.database.database import Base

class PromoCodeModel(Base):
    __tablename__ = "promo_codes"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    

    promo_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    value: Mapped[float] = mapped_column(Float, nullable=False)

    max_uses: Mapped[int] = mapped_column(Integer, default=1)
    used_count: Mapped[int] = mapped_column(Integer, default=0)
    max_uses_per_user: Mapped[int] = mapped_column(Integer, default=1)

    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), index=True)
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    min_purchase_amount: Mapped[float] = mapped_column(Float, default=0)
    allowed_user_ids: Mapped[Optional[List[int]]] = mapped_column(JSON, nullable=True)


    status: Mapped[str] = mapped_column(String(20), default='active', index=True)
    
    total_discount_amount: Mapped[float] = mapped_column(Float, default=0)
    total_purchases: Mapped[int] = mapped_column(Integer, default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())
    
    user_promos: Mapped[List["UserPromoCodeModel"]] = relationship("UserPromoCodeModel", back_populates="promo_code")

class UserPromoCodeModel(Base):
    __tablename__ = "user_promo_codes"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    promo_code_id: Mapped[int] = mapped_column(ForeignKey("promo_codes.id"), nullable=False, index=True)


    status: Mapped[str] = mapped_column(String(20), default='active', index=True)  # 'active', 'applied'

    activated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), index=True)
    applied_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    
    user: Mapped["UsersModel"] = relationship("UsersModel", back_populates="active_promos")
    promo_code: Mapped["PromoCodeModel"] = relationship("PromoCodeModel", back_populates="user_promos")