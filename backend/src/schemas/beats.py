from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


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
    size: int
    duration: float
    created_at: datetime
    updated_at: datetime
    author: UserInfo
    
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
                "size": obj.size,
                "duration": obj.duration,
                "created_at": obj.created_at,
                "updated_at": obj.updated_at,
                "author": {
                    "id": obj.owner.id,
                    "username": obj.owner.username
                }
            }
            return cls(**data)
        return super().model_validate(obj)
    
    
    

class BeatListResponse(BaseModel):
    beats: List[BeatResponse]
    total: int
    page: int
    pages: int