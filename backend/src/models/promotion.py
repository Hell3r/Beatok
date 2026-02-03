from sqlalchemy import Column, Integer, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timedelta
from typing import Optional
from src.database.database import Base

class BeatPromotionModel(Base):
    __tablename__ = "beat_promotions"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    beat_id: Mapped[int] = mapped_column(Integer, ForeignKey("beats.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    
    price: Mapped[float] = mapped_column(Float, default=150.0)
    
    starts_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ends_at: Mapped[datetime] = mapped_column(DateTime)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    beat = relationship("BeatModel", back_populates="promotions")
    user = relationship("UsersModel", back_populates="beat_promotions")
    
    @property
    def days_remaining(self) -> int:
        if not self.is_active:
            return 0
        remaining = (self.ends_at - datetime.utcnow()).days
        return max(0, remaining)
    
    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.ends_at