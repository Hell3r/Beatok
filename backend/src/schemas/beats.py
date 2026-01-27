from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from src.schemas.beat_pricing import BeatPricingResponseSchema

class UserInfo(BaseModel):
    id: int
    username: str
    avatar_path: Optional[str] = None

class BeatBase(BaseModel):
    name: str
    genre: str
    tempo: int
    key: str
    promotion_status: str = Field(default="standard", pattern="^(standard|premium)$")
    status: str = Field(default="active", pattern="^(active|inactive)$")
    

class BeatCreate(BeatBase):
    pass

class BeatFingerprintInfo(BaseModel):
    fingerprint: str 
    timings: List[Dict[str, Any]]
    method: str = Field(default="64bit_4x16")

class BeatResponse(BaseModel):
    id: int
    name: str
    genre: str
    tempo: int
    key: str
    promotion_status: str
    rejection_reason: Optional[str] = None
    size: int
    duration: float
    created_at: datetime
    updated_at: datetime
    likes_count: int = 0
    
    owner: UserInfo 
    
    pricings: List[BeatPricingResponseSchema] = []
    audio_fingerprint: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def model_validate(cls, obj):
        if hasattr(obj, 'owner') and obj.owner:
            owner_data = {
                "id": obj.owner.id,
                "username": obj.owner.username,
                "avatar_path": obj.owner.avatar_path
            }
            
            data = {
                "id": obj.id,
                "name": obj.name,
                "genre": obj.genre,
                "tempo": obj.tempo,
                "key": obj.key,
                "promotion_status": obj.promotion_status,
                "rejection_reason": obj.rejection_reason,
                "size": obj.size,
                "duration": obj.duration,
                "created_at": obj.created_at,
                "updated_at": obj.updated_at,
                "likes_count": getattr(obj, 'likes_count', 0),
                "owner": owner_data,
                "pricings": [
                    {
                        "id": pricing.id,
                        "beat_id": pricing.beat_id,
                        "tariff_name": pricing.tariff_name,
                        "tariff_display_name": pricing.tariff.display_name if pricing.tariff else None,
                        "tariff_type": pricing.tariff.type.value if pricing.tariff else None,
                        "price": pricing.price,
                        "is_available": pricing.is_available
                    }
                    for pricing in obj.pricings
                ] if hasattr(obj, 'pricings') else [],
                "audio_fingerprint": obj.audio_fingerprint
            }
            return cls(**data)
        return super().model_validate(obj)