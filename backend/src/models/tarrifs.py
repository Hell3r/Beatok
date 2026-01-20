from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database.database import Base
from datetime import datetime
from typing import Optional, List
import enum

class TariffType(str, enum.Enum):
    LEASING = "leasing"
    EXCLUSIVE = "exclusive"

class TariffTemplateModel(Base):
    __tablename__ = "tariffs"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500))
    type: Mapped[TariffType] = mapped_column(Enum(TariffType), default=TariffType.LEASING)  # НОВОЕ ПОЛЕ
    
    bit_pricings: Mapped[List["BeatPricingModel"]] = relationship("BeatPricingModel", back_populates="tariff")
    purchases: Mapped[List["PurchaseModel"]] = relationship("PurchaseModel", back_populates="tariff", cascade="all, delete-orphan")