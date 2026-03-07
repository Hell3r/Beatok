from pydantic import BaseModel, Field, validator
from decimal import Decimal
from datetime import datetime
from typing import List, Optional
from src.models.withdrawal import WithdrawalStatus


class WithdrawalCreate(BaseModel):
    amount: Decimal = Field(..., gt=0, description="Сумма вывода")
    card_number: str = Field(..., min_length=16, max_length=16, description="Номер карты (16 цифр)")
    description: Optional[str] = Field(None, max_length=255, description="Комментарий")
    
    @validator('amount')
    def validate_amount(cls, v):
        if v < Decimal('100.00'):
            raise ValueError('Минимальная сумма вывода 100 ₽')
        if v > Decimal('100000.00'):
            raise ValueError('Максимальная сумма вывода 100 000 ₽')
        return v
    
    @validator('card_number')
    def validate_card(cls, v):
        if not v.isdigit():
            raise ValueError('Номер карты должен содержать только цифры')
        return v


class WithdrawalResponse(BaseModel):
    id: int = Field(..., description="ID запроса в БД")
    amount: float = Field(..., description="Сумма")
    status: str = Field(..., description="Статус запроса")
    card_number: str = Field(..., description="Номер карты")
    created_at: datetime = Field(..., description="Дата создания")
    
    class Config:
        from_attributes = True


class WithdrawalStatusResponse(BaseModel):
    id: int = Field(..., description="ID запроса в БД")
    amount: float = Field(..., description="Сумма")
    status: str = Field(..., description="Статус (pending/succeeded/failed)")
    created_at: datetime = Field(..., description="Дата создания")
    paid_at: Optional[datetime] = Field(None, description="Дата обработки")
    description: Optional[str] = Field(None, description="Описание")
    card_number: Optional[str] = Field(None, description="Номер карты")
    
    class Config:
        from_attributes = True


class WithdrawalAdminResponse(BaseModel):
    id: int = Field(..., description="ID запроса в БД")
    user_id: int = Field(..., description="ID пользователя")
    username: str = Field(..., description="Имя пользователя")
    email: str = Field(..., description="Email пользователя")
    amount: float = Field(..., description="Сумма")
    status: str = Field(..., description="Статус")
    card_number: str = Field(..., description="Номер карты")
    description: Optional[str] = Field(None, description="Описание")
    created_at: datetime = Field(..., description="Дата создания")
    paid_at: Optional[datetime] = Field(None, description="Дата обработки")
    
    class Config:
        from_attributes = True


class WithdrawalHistoryResponse(BaseModel):
    total: int = Field(..., description="Общее количество")
    offset: int = Field(..., description="Смещение")
    limit: int = Field(..., description="Количество на странице")
    items: List[WithdrawalStatusResponse] = Field(..., description="Список выводов")
