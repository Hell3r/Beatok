from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database.database import Base
from sqlalchemy import Date, Boolean
from datetime import date
from typing import List

class UsersModel(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column()
    date_of_reg: Mapped[date] = mapped_column(Date, default=date.today)
    birthday: Mapped[date] = mapped_column(Date)
    email: Mapped[str] = mapped_column()
    password: Mapped[str] = mapped_column()
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    beats: Mapped[List["BeatModel"]] = relationship("BeatModel", back_populates="owner")
    
    def __repr__(self) -> str:
        return f"User(id={self.id}, username='{self.username}', email='{self.email}')"