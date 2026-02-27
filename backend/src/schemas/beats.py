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
    promotion_status: str = "standard"
    status: str = "active"
    

class TermsOfUseCreate(BaseModel):
    recording_tracks: bool = False
    commercial_perfomance: bool = False
    rotation_on_the_radio: bool = False
    music_video_recording: bool = False
    release_of_copies: bool = False

class TermsOfUseResponse(BaseModel):
    recording_tracks: bool = False
    commercial_perfomance: bool = False
    rotation_on_the_radio: bool = False
    music_video_recording: bool = False
    release_of_copies: bool = False
    
    model_config = ConfigDict(from_attributes=True)

class BeatCreate(BeatBase):
    terms_of_use: Optional[TermsOfUseCreate] = None

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
    status: str
    rejection_reason: Optional[str] = None
    size: int
    duration: float
    created_at: datetime
    updated_at: datetime
    likes_count: int = 0
    
    owner: UserInfo 
    
    pricings: List[BeatPricingResponseSchema] = []
    audio_fingerprint: Optional[str] = None
    terms_of_use: Optional[TermsOfUseResponse] = None
    
    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def model_validate(cls, obj):
        if hasattr(obj, 'owner') and obj.owner:
            owner_data = {
                "id": obj.owner.id,
                "username": obj.owner.username,
                "avatar_path": obj.owner.avatar_path
            }

            terms_of_use_data = None

            if hasattr(obj, 'terms_of_use_backref') and obj.terms_of_use_backref:
                terms_list = obj.terms_of_use_backref
                if terms_list and len(terms_list) > 0:
                    terms_obj = terms_list[0]
                    terms_of_use_data = {
                        "recording_tracks": terms_obj.recording_tracks,
                        "commercial_perfomance": terms_obj.commercial_perfomance,
                        "rotation_on_the_radio": terms_obj.rotation_on_the_radio,
                        "music_video_recording": terms_obj.music_video_recording,
                        "release_of_copies": terms_obj.release_of_copies
                    }
            elif hasattr(obj, 'terms_of_use') and obj.terms_of_use:
                terms_obj = obj.terms_of_use
                if terms_obj:
                    terms_of_use_data = {
                        "recording_tracks": terms_obj.recording_tracks,
                        "commercial_perfomance": terms_obj.commercial_perfomance,
                        "rotation_on_the_radio": terms_obj.rotation_on_the_radio,
                        "music_video_recording": terms_obj.music_video_recording,
                        "release_of_copies": terms_obj.release_of_copies
                    }

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
                "audio_fingerprint": obj.audio_fingerprint,
                "terms_of_use": terms_of_use_data
            }
            return cls(**data)
        return super().model_validate(obj)