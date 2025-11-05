from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from sqlalchemy import select
from decimal import Decimal
from src.dependencies.services import PromoServiceDep
from src.dependencies.auth import CurrentUser, AdminUser
from src.database.deps import SessionDep
from src.schemas.favorite import FavoriteCreate, FavoriteResponse, FavoriteListResponse
from src.models.favorite import FavoriteModel
from src.models.beats import BeatModel
from src.models.beat_bricing import BeatPricingModel
from sqlalchemy.orm import joinedload, selectinload


router = APIRouter(prefix="/v1/favorite", tags=["Избранное"])


@router.post("/{beat_id}", response_model=FavoriteResponse)
async def add_to_favorites(
    beat_id: int,
    current_user: CurrentUser,
    session: SessionDep
):
    beat = await session.get(BeatModel, beat_id)
    if not beat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бит не найден"
        )

    existing_favorite = await session.execute(
        select(FavoriteModel).where(
            FavoriteModel.user_id == current_user.id,
            FavoriteModel.beat_id == beat_id
        )
    )
    if existing_favorite.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Бит уже в избранном"
        )

    favorite = FavoriteModel(
        user_id=current_user.id,
        beat_id=beat_id
    )
    session.add(favorite)
    await session.commit()
    await session.refresh(favorite)

    return FavoriteResponse.model_validate(favorite)


@router.delete("/{beat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_favorites(
    beat_id: int,
    current_user: CurrentUser,
    session: SessionDep
):
    favorite = await session.execute(
        select(FavoriteModel).where(
            FavoriteModel.user_id == current_user.id,
            FavoriteModel.beat_id == beat_id
        )
    )
    favorite = favorite.scalar_one_or_none()

    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бит не найден в избранном"
        )

    await session.delete(favorite)
    await session.commit()


@router.get("", response_model=List[dict])
async def get_user_favorites(
    current_user: CurrentUser,
    session: SessionDep
):
    favorites = await session.execute(
        select(FavoriteModel)
        .where(FavoriteModel.user_id == current_user.id)
    )
    favorites = favorites.scalars().all()

    beat_ids = [fav.beat_id for fav in favorites]
    if not beat_ids:
        return []

    beats_result = await session.execute(
        select(BeatModel)
        .options(
            joinedload(BeatModel.owner),
            joinedload(BeatModel.pricings).joinedload(BeatPricingModel.tariff)
        )
        .where(BeatModel.id.in_(beat_ids))
    )
    beats = beats_result.unique().scalars().all()

    beats_dict = {beat.id: beat for beat in beats}

    result = []
    for favorite in favorites:
        beat = beats_dict.get(favorite.beat_id)
        if beat:
            pricings_data = []
            if beat.pricings:
                for pricing in beat.pricings:
                    pricings_data.append({
                        "id": pricing.id,
                        "beat_id": pricing.beat_id,
                        "tariff_name": pricing.tariff_name,
                        "tariff_display_name": pricing.tariff.display_name if pricing.tariff else pricing.tariff_name,
                        "price": float(pricing.price) if pricing.price else None,
                        "is_available": pricing.is_available
                    })

            result.append({
                "id": beat.id,
                "name": beat.name,
                "owner": {
                    "id": beat.owner.id,
                    "username": beat.owner.username,
                    "email": beat.owner.email,
                    "avatar_path": beat.owner.avatar_path
                } if beat.owner else None,
                "genre": beat.genre,
                "tempo": beat.tempo,
                "key": beat.key,
                "duration": beat.duration,
                "price": 0,
                "status": beat.status.value,
                "created_at": beat.created_at.isoformat() if beat.created_at else None,
                "updated_at": beat.updated_at.isoformat() if beat.updated_at else None,
                "author_id": beat.author_id,
                "cover_path": None,
                "audio_path": None,
                "pricings": pricings_data
            })

    return result