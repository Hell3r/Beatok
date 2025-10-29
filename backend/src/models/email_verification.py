from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timedelta
from src.database.database import Base
import uuid

class EmailVerificationModel(Base):
    __tablename__ = "email_verifications"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    token: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    verification_type: Mapped[str] = mapped_column(String(20), default="registration")
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.token = str(uuid.uuid4())
        self.expires_at = datetime.utcnow() + timedelta(hours=1)
    
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
    
    def is_valid(self) -> bool:
        return not self.is_used and not self.is_expired()