from fastapi import APIRouter, Depends, HTTPException
from typing import List
import logging
from src.dependencies.auth import CurrentUserId
from src.dependencies.services import PurchaseServiceDep
from src.schemas.purchase import (
    PurchaseBeatRequest,
    PurchaseBeatResponse,
    AvailableTariffResponse,
    UserPurchaseResponse
)

router = APIRouter(prefix="/purchase", tags=["Покупки"])
logger = logging.getLogger(__name__)

@router.post("/beat", response_model=PurchaseBeatResponse, summary="Купить бит")
async def purchase_beat(
    request: PurchaseBeatRequest,
    user_id: CurrentUserId,
    purchase_service: PurchaseServiceDep
):
    try:
        result = await purchase_service.purchase_beat(
            beat_id=request.beat_id,
            tariff_name=request.tariff_name,
            purchaser_id=user_id
        )
        
        return PurchaseBeatResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Purchase error: {e}")
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")

@router.get("/beat/{beat_id}/tariffs", response_model=List[AvailableTariffResponse], summary="Доступные тарифы для бита")
async def get_available_tariffs(
    beat_id: int,
    user_id: CurrentUserId,
    purchase_service: PurchaseServiceDep
):
    try:
        tariffs = await purchase_service.get_available_tariffs_for_beat(beat_id, user_id)
        return tariffs
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка получения тарифов")

@router.get("/my", response_model=List[UserPurchaseResponse], summary="Мои покупки")
async def get_my_purchases(
    user_id: CurrentUserId,
    purchase_service: PurchaseServiceDep
):
    try:
        purchases = await purchase_service.get_user_purchases(user_id)
        return purchases
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка получения покупок")