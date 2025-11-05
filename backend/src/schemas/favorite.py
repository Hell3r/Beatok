from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class FavoriteBase(BaseModel):
    beat_id: int
    user_id: int


class FavoriteCreate(BaseModel):
    beat_id: int


class FavoriteResponse(BaseModel):
    id: int
    beat_id: int
    user_id: int

    class Config:
        from_attributes = True


class FavoriteListResponse(BaseModel):
    favorites: List[FavoriteResponse]

    class Config:
        from_attributes = True
