from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class PromoType(str, Enum):
    BALANCE = "balance"
    DISCOUNT = "discount" 
    PERCENT = "percent"

class PromoCodeBase(BaseModel):
    code: str
    description: Optional[str] = None
    promo_type: PromoType
    value: float
    max_uses: int = 1
    max_uses_per_user: int = 1
    valid_until: datetime
    min_purchase_amount: float = 0
    allowed_user_ids: Optional[List[int]] = None

    @field_validator('code')
    @classmethod
    def validate_code(cls, v):
        return v.upper().strip()

    @field_validator('value')
    @classmethod
    def validate_value(cls, v, info):
        promo_type = info.data.get('promo_type')
        if promo_type == PromoType.PERCENT and (v <= 0 or v > 100):
            raise ValueError('Процентная скидка должна быть от 1% до 100%')
        if promo_type in [PromoType.BALANCE, PromoType.DISCOUNT] and v <= 0:
            raise ValueError('Сумма должна быть положительной')
        return v

class PromoCodeCreate(PromoCodeBase):
    pass

class PromoCodeResponse(PromoCodeBase):
    id: int
    used_count: int
    status: str
    total_discount_amount: float
    total_purchases: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ActivatePromoRequest(BaseModel):
    promo_code: str

class ApplyPromoRequest(BaseModel):
    purchase_amount: float = 0

class ActivatePromoResponse(BaseModel):
    success: bool
    message: str
    promo_type: Optional[PromoType] = None
    value: Optional[float] = None
    user_promo_id: Optional[int] = None

class ApplyPromoResponse(BaseModel):
    success: bool
    message: str
    promo_type: Optional[PromoType] = None
    discount_amount: Optional[float] = None
    bonus_amount: Optional[float] = None
    final_amount: Optional[float] = None
    promo_code: Optional[str] = None
    user_promo_id: Optional[int] = None

class UserPromoCodeResponse(BaseModel):
    id: int
    promo_code: PromoCodeResponse
    status: str
    activated_at: datetime
    expires_at: datetime
    
    class Config:
        from_attributes = True

class PromoCodeUsageResponse(BaseModel):
    id: int
    promo_code: str
    discount_amount: float
    purchase_amount: float
    final_amount: float
    applied_at: datetime
    
    class Config:
        from_attributes = True