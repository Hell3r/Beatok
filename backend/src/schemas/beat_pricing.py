from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class BeatPricingBase(BaseModel):
    id: int
    bit_id : int
    tarrif_name: str
    price: float
    is_available: bool
    