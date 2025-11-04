from fastapi import Depends, HTTPException, status
from typing_extensions import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.database import get_session
from src.models.users import UsersModel
from src.services.PromoService import PromoCodeService
from src.services.AuthService import get_current_user
from src.services.PaymentFacade import PaymentFacadeService
from src.services.BalanceService import BalanceService
from src.database.deps import SessionDep

async def get_promo_service(session: SessionDep) -> PromoCodeService:
    return PromoCodeService(session)

async def get_payment_service(session: SessionDep) -> PaymentFacadeService:
    return PaymentFacadeService(session)

async def get_balance_service(session: SessionDep) -> BalanceService:
    return BalanceService(session)



PromoServiceDep = Annotated[PromoCodeService, Depends(get_promo_service)]
PaymentFacadeServiceDep = Annotated[PaymentFacadeService, Depends(get_payment_service)]