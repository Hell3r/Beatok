from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database.database import Base
from sqlalchemy import Date, Boolean, String, DECIMAL, DateTime, Integer, ForeignKey
from datetime import date, datetime
from typing import List, Optional

class PurchaseModel(Base):
    __tablename__ = "purchases"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    purchaser_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    seller_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    beat_id: Mapped[int] = mapped_column(Integer, ForeignKey("beats.id", ondelete="CASCADE"), index=True)
    tariff_name: Mapped[str] = mapped_column(String(50), ForeignKey("tariffs.name"), index=True)
    amount: Mapped[float] = mapped_column(DECIMAL(10, 2))
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, completed, canceled
    transaction_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    seller: Mapped["UsersModel"] = relationship("UsersModel", foreign_keys=[seller_id], back_populates="sales")
    purchaser: Mapped["UsersModel"] = relationship("UsersModel", foreign_keys=[purchaser_id], back_populates="purchases")
    beat: Mapped["BeatModel"] = relationship("BeatModel", back_populates="purchases")
    tariff: Mapped["TariffTemplateModel"] = relationship("TariffTemplateModel", foreign_keys=[tariff_name], primaryjoin="PurchaseModel.tariff_name == TariffTemplateModel.name")
