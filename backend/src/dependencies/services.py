from fastapi import Depends, HTTPException, status
from typing_extensions import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.database import get_session
from src.models.users import UsersModel
from src.services.PromoService import PromoCodeService
from src.services.AuthService import get_current_user
from src.database.deps import SessionDep

async def get_promo_service(session: SessionDep) -> PromoCodeService:
    return PromoCodeService(session)

PromoServiceDep = Annotated[PromoCodeService, Depends(get_promo_service)]