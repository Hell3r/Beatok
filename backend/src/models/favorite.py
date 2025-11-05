from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database.database import Base
from sqlalchemy import Date, Boolean, String, DECIMAL, DateTime, Integer, ForeignKey
from datetime import date, datetime
from typing import List, Optional



class FavoriteModel(Base):
    __tablename__ = "favorite_beats"
    
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    beat_id: Mapped[int] = mapped_column(Integer, ForeignKey("beats.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    
    
    user: Mapped["UsersModel"] = relationship("UsersModel", back_populates="favorites")
