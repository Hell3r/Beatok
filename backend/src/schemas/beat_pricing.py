from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class BeatPricingSchema(BaseModel):
    beat_id: int = Field(..., description="ID бита")
    tariff_name: str = Field(..., max_length=50, description="Название тарифа")
    price: Optional[float] = Field(None, ge=0, description="Цена")
    is_available: bool = Field(True, description="Доступен ли тариф для покупки")
    
    
    
class BeatPricingCreateSchema(BeatPricingSchema):
    pass



class BeatPricingResponseSchema(BaseModel):
    id: int
    beat_id: int
    tariff_name: str
    tariff_display_name: Optional[str] = None
    price: Optional[Decimal] = None
    is_available: bool
    
    model_config = ConfigDict(from_attributes=True)
        
        
class BeatAllPricingsResponseSchema(BaseModel):
    beat_id: int
    beat_title: Optional[str] = None
    pricings: List[BeatPricingResponseSchema] = []
    
    model_config = ConfigDict(from_attributes=True)
    
    
    
    