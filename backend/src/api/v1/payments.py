from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal
from typing import Optional
import logging

from src.database.database import get_session
from src.services.TPayService import TPayService
from src.schemas.payment import PaymentCreate, PaymentResponse, PaymentStatusResponse
from src.dependencies.auth import get_current_user
from src.models.users import UsersModel

router = APIRouter(prefix="/payment", tags=["Платежи T-Pay"])


@router.post("/tpay/create", response_model=PaymentResponse, summary = "Создать платеж")
async def create_tpay_payment(
    data: PaymentCreate,
    session: AsyncSession = Depends(get_session),
    current_user: UsersModel = Depends(get_current_user)
):
    service = TPayService(session)
    
    try:
        result = await service.create_payment(
            user_id=current_user.id,
            amount=data.amount,
            description=data.description
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка создания платежа: {str(e)}")


@router.get("/tpay/status/{payment_id}", response_model=PaymentStatusResponse, summary = "Получить статус платежа по id")
async def get_payment_status(
    payment_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: UsersModel = Depends(get_current_user)
):

    service = TPayService(session)
    
    try:
        status = await service.get_payment_status(payment_id, current_user.id)
        return status
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения статуса: {str(e)}")


@router.get("/tpay/my", summary = "История платежей авторизованного пользователя")
async def get_my_payments(
    session: AsyncSession = Depends(get_session),
    current_user: UsersModel = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100, description="Количество записей"),
    offset: int = Query(0, ge=0, description="Смещение")
):
    service = TPayService(session)
    
    try:
        payments = await service.get_user_payments(
            user_id=current_user.id,
            limit=limit,
            offset=offset
        )
        return {
            "total": len(payments),
            "offset": offset,
            "limit": limit,
            "items": payments
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения истории: {str(e)}")