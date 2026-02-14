# src/api/v1/payment.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal
from typing import Optional

from src.database.database import get_session
from src.services.TPayService import TPayService
from src.schemas.payment import PaymentCreate, PaymentResponse, PaymentStatusResponse
from src.dependencies.auth import get_current_user
from src.models.users import UsersModel

router = APIRouter(prefix="/payment", tags=["Платежи T-Pay"])


@router.post("/tpay/create", response_model=PaymentResponse)
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


@router.get("/tpay/status/{payment_id}", response_model=PaymentStatusResponse)
async def get_payment_status(
    payment_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: UsersModel = Depends(get_current_user)
):
    """
    Получить статус платежа
    
    - **payment_id**: ID платежа в нашей системе
    
    Возвращает актуальный статус платежа из базы данных.
    Статус обновляется автоматически при редиректе с T-Pay на страницу успеха.
    """
    service = TPayService(session)
    
    try:
        status = await service.get_payment_status(payment_id, current_user.id)
        return status
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения статуса: {str(e)}")


@router.get("/tpay/my")
async def get_my_payments(
    session: AsyncSession = Depends(get_session),
    current_user: UsersModel = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100, description="Количество записей"),
    offset: int = Query(0, ge=0, description="Смещение")
):
    """
    Получить историю своих платежей
    
    - **limit**: количество записей (1-100, по умолчанию 50)
    - **offset**: смещение для пагинации
    
    Возвращает список платежей текущего пользователя, отсортированный по дате создания (новые сверху).
    """
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


@router.get("/tpay/info")
async def get_tpay_info(
    current_user: UsersModel = Depends(get_current_user)
):
    """
    Получить информацию о платежной системе T-Pay
    
    Возвращает:
    - минимальную и максимальную сумму
    - комиссию
    - инструкции по оплате
    - поддерживаемые банки
    """
    from src.core.config import settings
    
    return {
        "provider": "T-Pay (Т-Банк)",
        "description": "Быстрые платежи через приложение Т-Банка",
        "limits": {
            "min_amount": 10.0,
            "max_amount": 100000.0
        },
        "fee": "0% для пользователя",
        "processing_time": "мгновенно",
        "instructions": [
            "1. Нажмите кнопку «Оплатить»",
            "2. Вы будете перенаправлены на страницу Т-Банка",
            "3. Подтвердите платеж в приложении Т-Банка",
            "4. После оплаты вы вернетесь на страницу успеха",
            "5. Средства зачислятся на баланс мгновенно"
        ],
        "supported_banks": [
            "Т-Банк",
            "Сбербанк",
            "ВТБ",
            "Альфа-Банк",
            "и все банки, подключенные к СБП"
        ],
        "test_mode": settings.YOOKASSA_TEST_MODE if hasattr(settings, 'YOOKASSA_TEST_MODE') else False
    }


@router.post("/tpay/webhook")
async def tpay_webhook(
    data: dict,
    session: AsyncSession = Depends(get_session)
):
    logger = logging.getLogger(__name__)
    logger.info(f"Received T-Pay webhook (ignored): {data}")
    
    # T-Pay ожидает ответ "OK" 200
    return {"status": "OK"}