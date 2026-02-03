from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional
from datetime import date
from src.models.tarrifs import TariffType



class TarrifCreate(BaseModel):
    name: str
    display_name: str
    description: str


class TarrifResponse(BaseModel):
    id: int
    name: str
    display_name: str
    description: str
    type: TariffType
    
    class Config:
        from_attributes = True
        json_encoders = {
            TariffType: lambda v: v.value  # Для сериализации enum в JSON
        }