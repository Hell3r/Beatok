from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal
from typing import Optional
import logging

from src.database.database import get_session
from src.services.WithdrawalService import WithdrawalService
from src.schemas.withdrawal import (
    WithdrawalCreate, 
    WithdrawalResponse, 
    WithdrawalStatusResponse,
    WithdrawalHistoryResponse
)
from src.dependencies.auth import get_current_user
from src.models.users import UsersModel

router = APIRouter(prefix="/withdrawal", tags=["Вывод средств"])
logger = logging.getLogger(__name__)


@router.post("/create", response_model=WithdrawalResponse, summary="Создать запрос на вывод")
async def create_withdrawal(
    data: WithdrawalCreate,
    session: AsyncSession = Depends(get_session),
    current_user: UsersModel = Depends(get_current_user)
):
    service = WithdrawalService(session)
    
    try:
        result = await service.create_withdrawal(
            user_id=current_user.id,
            data=data
        )
        await session.commit()
        return result
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await session.rollback()
        logger.error(f"WITHDRAWAL_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Ошибка при создании запроса на вывод")


@router.get("/status/{withdrawal_id}", response_model=WithdrawalStatusResponse, summary="Получить статус вывода")
async def get_withdrawal_status(
    withdrawal_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: UsersModel = Depends(get_current_user)
):
    service = WithdrawalService(session)
    
    try:
        result = await service.get_withdrawal_status(
            withdrawal_id=withdrawal_id,
            user_id=current_user.id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"WITHDRAWAL_STATUS_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Ошибка при получении статуса")


@router.get("/my", response_model=WithdrawalHistoryResponse, summary="История выводов пользователя")
async def get_my_withdrawals(
    session: AsyncSession = Depends(get_session),
    current_user: UsersModel = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100, description="Количество записей"),
    offset: int = Query(0, ge=0, description="Смещение")
):
    service = WithdrawalService(session)
    
    try:
        items = await service.get_user_withdrawals(
            user_id=current_user.id,
            limit=limit,
            offset=offset
        )
        total = await service.get_user_withdrawals_count(current_user.id)
        
        return WithdrawalHistoryResponse(
            total=total,
            offset=offset,
            limit=limit,
            items=items
        )
    except Exception as e:
        logger.error(f"WITHDRAWAL_HISTORY_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Ошибка при получении истории")
