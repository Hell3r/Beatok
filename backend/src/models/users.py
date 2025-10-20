from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database.database import Base
from sqlalchemy import Date, Boolean, String, DECIMAL
from datetime import date
from typing import List, Optional

class UsersModel(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column()
    date_of_reg: Mapped[date] = mapped_column(Date, default=date.today)
    birthday: Mapped[date] = mapped_column(Date)
    email: Mapped[str] = mapped_column()
    password: Mapped[str] = mapped_column()
    role: Mapped[str] = mapped_column(default = "common")
    balance: Mapped[float] = mapped_column(DECIMAL(10, 2), default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    avatar_path: Mapped[Optional[str]] = mapped_column(String(500), default = "static/default_avatar.jpg" )
    
    
    requests: Mapped[List["RequestsModel"]] = relationship("RequestsModel", back_populates="user")
    beats: Mapped[List["BeatModel"]] = relationship("BeatModel", back_populates="owner")
    purchases: Mapped[List["PurchaseModel"]] = relationship("PurchaseModel", back_populates="user")
    active_promos: Mapped[List["UserPromoCodeModel"]] = relationship("UserPromoCodeModel", back_populates="user")
    promo_usages: Mapped[List["PromoCodeUsageModel"]] = relationship("PromoCodeUsageModel", back_populates="user")
    
    def __repr__(self) -> str:
        return f"User(id={self.id}, username='{self.username}', email='{self.email}')"