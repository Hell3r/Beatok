from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from src.schemas.beat_pricing import BeatPricingResponseSchema


class UserInfo(BaseModel):
    id : int
    username: str



class BeatBase(BaseModel):
    name: str
    genre: str
    tempo: int
    key: str
    promotion_status: str = "standard"
    status: str = "active"

class BeatCreate(BeatBase):
    pass

class BeatResponse(BaseModel):
    id: int
    name: str
    genre: str
    tempo: int
    key: str
    promotion_status: str
    status: str
    rejection_reason: Optional[str] = None
    size: int
    duration: float
    created_at: datetime
    updated_at: datetime
    author: UserInfo
    pricings: List[BeatPricingResponseSchema] = []
    
    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def model_validate(cls, obj):
        if hasattr(obj, 'owner') and obj.owner:
            data = {
                "id": obj.id,
                "name": obj.name,
                "genre": obj.genre,
                "tempo": obj.tempo,
                "key": obj.key,
                "promotion_status": obj.promotion_status,
                "status": obj.status,
                "rejection_reason": obj.rejection_reason,
                "size": obj.size,
                "duration": obj.duration,
                "created_at": obj.created_at,
                "updated_at": obj.updated_at,
                "author": {
                    "id": obj.owner.id,
                    "username": obj.owner.username
                },
                "pricings": [
                    {
                        "id": pricing.id,
                        "beat_id": pricing.beat_id,
                        "tariff_name": pricing.tariff_name,
                        "tariff_display_name": pricing.tariff.display_name if pricing.tariff else None,
                        "price": pricing.price,
                        "is_available": pricing.is_available
                    }
                    for pricing in obj.pricings
                ] if hasattr(obj, 'pricings') else []
            }
            return cls(**data)
        return super().model_validate(obj)
    
    
    

class BeatListResponse(BaseModel):
    beats: List[BeatResponse]
    total: int
    page: int
    pages: int