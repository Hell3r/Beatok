from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database.database import Base
from datetime import datetime
from typing import Optional, List
import enum


class StatusType(enum.Enum):
    MODERATED = "moderated"
    AVAILABLE = "available"
    DENIED = "denied"
    SOLD = "sold"


class BeatModel(Base):
    __tablename__ = "beats"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)

    mp3_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    wav_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    genre: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    tempo: Mapped[int] = mapped_column(Integer, nullable=False)
    key: Mapped[str] = mapped_column(String(10), nullable=False)
    
    audio_fingerprint: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        index=True
    )
    audio_fingerprint_timings: Mapped[Optional[str]] = mapped_column(
        String(2000),
        nullable=True
    )
    

    size: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    duration: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    promotion_status: Mapped[str] = mapped_column(String(20), default="standard", index=True)
    status: Mapped[StatusType] = mapped_column(Enum(StatusType), nullable = False, default = StatusType.MODERATED, index=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    owner: Mapped["UsersModel"] = relationship("UsersModel", back_populates="beats")
    pricings: Mapped[List["BeatPricingModel"]] = relationship("BeatPricingModel", back_populates="beat", cascade="all, delete-orphan")
    purchases: Mapped[List["PurchaseModel"]] = relationship("PurchaseModel", back_populates="beat", cascade="all, delete-orphan")
    
    
    
    
    
    
    def __repr__(self) -> str:
        return f"Beat(id={self.id}, name='{self.name}', author='{self.author}')"


