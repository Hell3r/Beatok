# src/schemas/balance.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

class BalanceResponse(BaseModel):
    balance: float
    currency: str = "RUB"

class DepositRequest(BaseModel):
    amount: float = Field(..., ge=1, description="Сумма пополнения")

class DepositResponse(BaseModel):
    success: bool
    message: str
    deposit_amount: float
    bonus_amount: float = 0
    total_amount: float
    new_balance: float
    promo_applied: bool = False
    promo_code: Optional[str] = None

class BalanceOperationResponse(BaseModel):
    id: int
    operation_type: str
    amount: float
    balance_before: float
    balance_after: float
    description: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class PaymentCreateRequest(BaseModel):
    amount: float = Field(..., ge=1, description="Сумма платежа")
    description: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    amount: float
    status: str
    payment_url: str
    external_payment_id: Optional[str] = None
    
    class Config:
        from_attributes = True