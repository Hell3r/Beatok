from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class PromoteBeatRequest(BaseModel):
    beat_id: int
    
    class Config:
        from_attributes = True

class PromoteBeatResponse(BaseModel):
    success: bool
    message: str
    beat_id: int
    beat_name: str
    price: float
    ends_at: datetime
    new_balance: float
    promotion_id: int
    
    class Config:
        from_attributes = True

class PromotionInfo(BaseModel):
    price: float = Field(150.0, description="Стоимость продвижения")
    duration_days: int = Field(3, description="Длительность продвижения")
    description: str = Field("Продвижение бита на 3 дня в топе", description="Описание услуги")