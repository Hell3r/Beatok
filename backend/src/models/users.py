from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database.database import Base
from sqlalchemy import Date, Boolean, String, DECIMAL, DateTime, Integer
from datetime import date, datetime
from typing import List, Optional

class UsersModel(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(index=True)
    date_of_reg: Mapped[date] = mapped_column(Date, default=date.today)
    birthday: Mapped[date] = mapped_column(Date)
    email: Mapped[str] = mapped_column(index=True)
    password: Mapped[str] = mapped_column()
    role: Mapped[str] = mapped_column(default = "common", index=True)
    balance: Mapped[float] = mapped_column(DECIMAL(10, 2), default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    avatar_path: Mapped[Optional[str]] = mapped_column(String(500), default = "static/default_avatar.png" )
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    download_count: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    prom_status: Mapped[str] = mapped_column(String(500), nullable= False, default= "standard")


    

   
    withdrawals = relationship("WithdrawalModel", back_populates="user", lazy="selectin")
    payments = relationship("PaymentModel", back_populates="user", lazy="selectin")
    active_promos = relationship("UserPromoCodeModel", back_populates="user", lazy="selectin")
    balance_operations = relationship("UserBalanceModel", back_populates="user", lazy="selectin")
    requests: Mapped[List["RequestsModel"]] = relationship("RequestsModel", back_populates="user")
    beats: Mapped[List["BeatModel"]] = relationship("BeatModel", back_populates="owner")
    active_promos: Mapped[List["UserPromoCodeModel"]] = relationship("UserPromoCodeModel", back_populates="user")
    favorites: Mapped[List["FavoriteModel"]] = relationship("FavoriteModel", back_populates="user")
    sales: Mapped[List["PurchaseModel"]] = relationship("PurchaseModel", foreign_keys="PurchaseModel.seller_id", back_populates="seller", cascade="all, delete-orphan")  
    purchases: Mapped[List["PurchaseModel"]] = relationship("PurchaseModel", foreign_keys="PurchaseModel.purchaser_id", back_populates="purchaser", cascade="all, delete-orphan")
    
    
    
    
    
    
    

    def __repr__(self) -> str:
        return f"User(id={self.id}, username='{self.username}', email='{self.email}')"
