from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional
from datetime import date



class Tarrifs(BaseModel):
    id : int
    name: str
    display_name: str
    description: str