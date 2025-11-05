from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class PaymentCreateRequest(BaseModel):
    amount: float = Field(..., ge=1, description="Сумма пополнения")
    description: Optional[str] = Field(None, description="Описание платежа")

class PaymentResponse(BaseModel):
    id: int
    amount: float
    status: str
    payment_url: str
    external_payment_id: Optional[str] = None
    
    class Config:
        from_attributes = True

class PaymentStatusResponse(BaseModel):
    id: int
    status: str
    amount: float
    payment_url: Optional[str]
    external_payment_id: Optional[str]
    created_at: datetime
    paid_at: Optional[datetime]

class WebhookRequest(BaseModel):
    type: str
    event: str
    object: dict