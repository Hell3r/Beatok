from pydantic import BaseModel, validator
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from enum import Enum

class PurchaseBeatRequest(BaseModel):
    """Запрос на покупку бита"""
    beat_id: int
    tariff_name: str

class PurchaseBeatResponse(BaseModel):
    """Ответ на покупку бита"""
    success: bool
    purchase_id: int
    beat_id: int
    beat_name: str
    tariff_name: str
    tariff_type: str
    amount: float
    purchaser_balance_before: float
    purchaser_balance_after: float
    seller_balance_before: float
    seller_balance_after: float
    message: str
    purchased_at: datetime

class AvailableTariffResponse(BaseModel):
    """Доступный тариф для покупки"""
    tariff_name: str
    display_name: str
    description: Optional[str]
    type: str
    price: float
    is_available: bool

class UserPurchaseResponse(BaseModel):
    """Покупка пользователя"""
    purchase_id: int
    beat_id: int
    beat_name: str
    beat_genre: str
    tariff_name: str
    tariff_type: str
    amount: float
    purchased_at: datetime
    is_exclusive: bool