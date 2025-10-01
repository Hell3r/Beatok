from fastapi import APIRouter, HTTPException, status, Depends, Response
from sqlalchemy import text, select
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List
from sqlalchemy.orm import Session
from src.database.database import engine, get_session, Base
from src.dependencies import SessionDep
from src.schemas.beat_pricing import BeatPricingCreateSchema, BeatPricingResponseSchema, BeatAllPricingsResponseSchema
from src.models.beat_bricing import BeatPricingModel
from src.models.beats import BeatModel
from src.models.tarrifs import TariffTemplateModel

router = APIRouter(prefix = "/v1/pricing", tags = ["Цены битов"])


@router.post("/", response_model=BeatPricingResponseSchema, summary="Добавить цену бита по тарифу")
async def create_pricing(
    session: SessionDep,
    pricing_data: BeatPricingCreateSchema
):
    try:
        beat_stmt = select(BeatModel).where(BeatModel.id == pricing_data.beat_id)
        beat_result = await session.execute(beat_stmt)
        beat = beat_result.scalar_one_or_none()
        
        if not beat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Бит с ID {pricing_data.beat_id} не найден"
            )
        
        
        tariff_stmt = select(TariffTemplateModel).where(TariffTemplateModel.name == pricing_data.tariff_name)
        tariff_result = await session.execute(tariff_stmt)
        tariff = tariff_result.scalar_one_or_none()
        
        if not tariff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Тариф с именем '{pricing_data.tariff_name}' не найден"
            )
        
        
        existing_pricing_stmt = select(BeatPricingModel).where(
            BeatPricingModel.beat_id == pricing_data.beat_id,
            BeatPricingModel.tariff_name == pricing_data.tariff_name
        )
        existing_result = await session.execute(existing_pricing_stmt)
        existing_pricing = existing_result.scalar_one_or_none()
        
        if existing_pricing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Цена для бита {pricing_data.beat_id} и тарифа '{pricing_data.tariff_name}' уже существует"
            )
        

        pricing = BeatPricingModel(
            beat_id=pricing_data.beat_id,
            tariff_name=pricing_data.tariff_name,
            price=pricing_data.price,
            is_available=pricing_data.is_available
        )
        
        session.add(pricing)
        await session.commit()
        await session.refresh(pricing)
        
        return pricing
        
    except IntegrityError as e:
        await session.rollback()
        if "foreign key constraint" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ошибка внешнего ключа. Проверьте существование бита и тарифа"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка целостности данных: {str(e)}"
        )
        
    except HTTPException:
        await session.rollback()
        raise
        
    except Exception as e:
        await session.rollback()
        print(f"Error creating pricing: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Внутренняя ошибка сервера"
        )
        
        
        
        
        
        
@router.get("/{beat_id}/pricings", response_model=BeatAllPricingsResponseSchema, summary="Получить все цены бита")
async def get_beat_pricings(
    beat_id: int,
    session: SessionDep
):
    try:
        stmt = (
            select(BeatModel)
            .options(
                selectinload(BeatModel.pricings).joinedload(BeatPricingModel.tariff)
            )
            .where(BeatModel.id == beat_id)
        )
        
        result = await session.execute(stmt)
        beat = result.unique().scalar_one_or_none()
        
        if not beat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Бит с ID {beat_id} не найден"
            )
        
        return BeatAllPricingsResponseSchema(
            beat_id=beat.id,
            beat_title=beat.name,
            pricings=[
                BeatPricingResponseSchema(
                    id=pricing.id,
                    beat_id=pricing.beat_id,
                    tariff_name=pricing.tariff_name,
                    tariff_display_name=pricing.tariff.display_name,
                    price=pricing.price,
                    is_available=pricing.is_available
                )
                for pricing in beat.pricings
            ]
        )
        
    except Exception as e:
        print(f"Error fetching beat pricings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Внутренняя ошибка сервера"
        )