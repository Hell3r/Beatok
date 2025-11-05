from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Boolean, DECIMAL, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database.database import Base
from datetime import datetime
from typing import Optional



class BeatPricingModel(Base):
    __tablename__ = "beat_pricing"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement= True)
    beat_id: Mapped[int] = mapped_column(Integer, ForeignKey("beats.id", ondelete="CASCADE"), nullable=False, index=True)
    tariff_name: Mapped[str] = mapped_column(String(50), ForeignKey("tariffs.name"), nullable=False, index=True)
    price: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    bit: Mapped["BeatModel"] = relationship("BeatModel", back_populates="pricings")
    tariff: Mapped["TariffTemplateModel"] = relationship("TariffTemplateModel", back_populates="bit_pricings")
    
    __table_args__ = (
        UniqueConstraint('beat_id', 'tariff_name', name='_bit_tariff_uc'),
    )
