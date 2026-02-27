from src.models.tags import TagModel
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
    promotions: Mapped[List["BeatPromotionModel"]] = relationship(
        "BeatPromotionModel", 
        back_populates="beat",
        cascade="all, delete-orphan"
    )

    tags: Mapped[List["TagModel"]] = relationship(
        "TagModel", 
        back_populates="beat", 
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    
    @property
    def is_promoted(self) -> bool:
        return self.promotion_status == "promoted"
    
    @property
    def active_promotion(self) -> Optional["BeatPromotionModel"]:
        if not self.promotions:
            return None
        
        for promotion in self.promotions:
            if promotion.is_active and not promotion.is_expired:
                return promotion
        return None
    
    @property
    def promotion_ends_at(self) -> Optional[datetime]:
        promotion = self.active_promotion
        return promotion.ends_at if promotion else None
    
    @property
    def promotion_days_left(self) -> int:
        promotion = self.active_promotion
        return promotion.days_remaining if promotion else 0
    
    @property
    def terms_of_use(self):
        if self.terms_of_use_backref and len(self.terms_of_use_backref) > 0:
            return self.terms_of_use_backref[0]
        return None
    
    
    def __repr__(self) -> str:
        return f"Beat(id={self.id}, name='{self.name}', author='{self.author}')"


