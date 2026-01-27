from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database.database import Base
from sqlalchemy import String, DateTime, Integer, ForeignKey, Boolean
from datetime import datetime, timedelta
from typing import Optional
import secrets

class DownloadTokenModel(Base):
    __tablename__ = "download_tokens"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    beat_id: Mapped[int] = mapped_column(Integer, ForeignKey("beats.id", ondelete="CASCADE"), nullable=False)
    purchase_id: Mapped[int] = mapped_column(Integer, ForeignKey("purchases.id", ondelete="CASCADE"), nullable=False)
    
    max_downloads: Mapped[int] = mapped_column(Integer, default=3)  # максимум 3 скачивания
    downloads_count: Mapped[int] = mapped_column(Integer, default=0)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_download_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    user: Mapped["UsersModel"] = relationship("UsersModel", backref="download_tokens")
    beat: Mapped["BeatModel"] = relationship("BeatModel", backref="download_tokens")
    purchase: Mapped["PurchaseModel"] = relationship("PurchaseModel", backref="download_tokens")
    
    @classmethod
    def generate_token(cls) -> str:
        return secrets.token_urlsafe(48) 
    
    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
    
    @property
    def can_download(self) -> bool:
        return (
            self.is_active 
            and not self.is_expired 
            and self.downloads_count < self.max_downloads
        )
    
    def get_download_url(self, base_url: str) -> str:
        return f"{base_url}/download/beat/{self.token}"