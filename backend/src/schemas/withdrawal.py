from pydantic import BaseModel, validator
from datetime import datetime
from decimal import Decimal
from typing import Optional

class WithdrawalBase(BaseModel):
    amount: Decimal
    card_number: str
    cardholder_name: Optional[str] = None

    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Сумма должна быть положительной')
        if v < Decimal('50.00'):
            raise ValueError('Минимальная сумма вывода 50 рублей')
        return v

    @validator('card_number')
    def validate_card_number(cls, v):
        v = v.replace(' ', '')
        if not v.isdigit() or len(v) != 16:
            raise ValueError('Некорректный номер карты')
        return v

class WithdrawalCreate(WithdrawalBase):
    pass

class WithdrawalUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None
    rejection_reason: Optional[str] = None

class WithdrawalResponse(BaseModel):
    id: int
    user_id: int
    amount: Decimal
    fee: Decimal
    net_amount: Decimal
    status: str
    card_number: str
    cardholder_name: Optional[str]
    created_at: datetime
    processed_at: Optional[datetime]
    completed_at: Optional[datetime]
    admin_notes: Optional[str]
    rejection_reason: Optional[str]

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v)
        }

class WithdrawalStats(BaseModel):
    total_withdrawals: int
    total_amount: Decimal
    pending_count: int
    completed_count: int
    failed_count: int