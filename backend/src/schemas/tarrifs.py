from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional
from datetime import date



class TarrifSchema(BaseModel):
    name: str
    display_name: str
    description: str
    
    
    
class TarrifCreate(TarrifSchema):
    pass


class TarrifResponse(TarrifSchema):
    id : int
    
    
    class Config:
        from_attributes = True