from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import logging

from src.database.database import get_session
from src.services.PromotionService import PromotionService
from src.schemas.promotion import PromoteBeatRequest, PromoteBeatResponse, PromotionInfo
from src.dependencies.auth import get_current_user_id

router = APIRouter(prefix="/promotion", tags=["Продвижение"])
logger = logging.getLogger(__name__)

@router.get("/info", response_model=PromotionInfo, summary = "Информация о продвижении")
async def get_promotion_info(session: AsyncSession = Depends(get_session)):
    try:
        service = PromotionService(session)
        info = await service.get_promotion_info()
        return info
    except Exception as e:
        logger.error(f"Error getting promotion info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/promote", response_model=PromoteBeatResponse, summary = "Продвинуть бит")
async def promote_beat(
    request: PromoteBeatRequest,
    user_id: int = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session)
):
    try:
        service = PromotionService(session)
        result = await service.promote_beat(user_id, request.beat_id)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error promoting beat: {e}")
        raise HTTPException(status_code=500, detail="Ошибка при продвижении бита")

@router.get("/my-promotions", summary = "Мои продвижения")
async def get_my_promotions(
    user_id: int = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session)
):
    try:
        service = PromotionService(session)
        promotions = await service.get_user_promotions(user_id)
        
        result = []
        for promo in promotions:
            result.append({
                "id": promo.id,
                "beat_id": promo.beat_id,
                "beat_name": promo.beat.name if promo.beat else "Unknown",
                "price": promo.price,
                "starts_at": promo.starts_at,
                "ends_at": promo.ends_at,
                "is_active": promo.is_active,
                "days_remaining": promo.days_remaining,
                "created_at": promo.created_at
            })
        
        return {
            "success": True,
            "promotions": result,
            "total": len(result)
        }
        
    except Exception as e:
        logger.error(f"Error getting user promotions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/beat/{beat_id}/status", summary = "Статус продвижения бита")
async def get_beat_promotion_status(
    beat_id: int,
    session: AsyncSession = Depends(get_session)
):
    try:
        from src.models.beats import BeatModel
        from sqlalchemy import select

        result = await session.execute(
            select(BeatModel).where(BeatModel.id == beat_id)
        )
        beat = result.scalar_one_or_none()
        
        if not beat:
            raise HTTPException(status_code=404, detail="Бит не найден")
        
        service = PromotionService(session)
        active_promotion = await service._get_active_promotion(beat_id)
        
        return {
            "beat_id": beat_id,
            "beat_name": beat.name,
            "promotion_status": beat.promotion_status,
            "is_promoted": beat.is_promoted,
            "active_promotion": {
                "ends_at": active_promotion.ends_at.isoformat() if active_promotion else None,
                "days_remaining": active_promotion.days_remaining if active_promotion else 0,
                "price": active_promotion.price if active_promotion else 0
            } if active_promotion else None,
            "promotion_info": {
                "price": service.PROMOTION_PRICE,
                "duration_days": service.PROMOTION_DURATION_DAYS
            },
            "can_promote": (
                beat.owner_id and 
                not beat.is_promoted and 
                beat.status != "SOLD" and 
                beat.is_active
            )
        }
        
    except Exception as e:
        logger.error(f"Error getting beat promotion status: {e}")
        raise HTTPException(status_code=500, detail=str(e))