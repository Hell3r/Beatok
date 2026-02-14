# src/schemas/payment.py
from pydantic import BaseModel, Field, validator
from decimal import Decimal
from datetime import datetime
from typing import Optional


class PaymentCreate(BaseModel):
    """Создание платежа"""
    amount: Decimal = Field(..., gt=0, description="Сумма пополнения")
    description: Optional[str] = Field(None, max_length=255, description="Описание платежа")
    
    @validator('amount')
    def validate_amount(cls, v):
        if v < Decimal('10.00'):
            raise ValueError('Минимальная сумма пополнения 10 ₽')
        if v > Decimal('100000.00'):
            raise ValueError('Максимальная сумма пополнения 100 000 ₽')
        return v
    
    class Config:
        json_encoders = {
            Decimal: str
        }


class PaymentResponse(BaseModel):
    """Ответ при создании платежа"""
    id: int = Field(..., description="ID платежа в БД")
    amount: float = Field(..., description="Сумма")
    payment_url: str = Field(..., description="Ссылка на страницу оплаты T-Банка")
    payment_id: str = Field(..., description="ID платежа в T-Pay")
    status: str = Field(..., description="Статус платежа")
    
    class Config:
        from_attributes = True


class PaymentStatusResponse(BaseModel):
    """Статус платежа"""
    id: int = Field(..., description="ID платежа в БД")
    amount: float = Field(..., description="Сумма")
    status: str = Field(..., description="Статус (pending/succeeded/failed/expired)")
    created_at: Optional[datetime] = Field(None, description="Дата создания")
    paid_at: Optional[datetime] = Field(None, description="Дата оплаты")
    tpay_payment_id: Optional[str] = Field(None, description="ID платежа в T-Pay")
    
    class Config:
        from_attributes = True