from fastapi import Depends
from typing_extensions import Annotated
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.database import get_session
from src.services.PromoService import PromoCodeService
from src.services.PaymentService import RealYookassaService
from src.services.BalanceService import BalanceService
from src.services.WithdrawalService import WithdrawalService
from src.services.PaymentFacade import PaymentFacadeService
from src.services.PurchaseService import PurchaseService
SessionDep = Annotated[AsyncSession, Depends(get_session)]

async def get_promo_service(session: SessionDep) -> PromoCodeService:
    return PromoCodeService(session)

async def get_yookassa_service(session: SessionDep) -> RealYookassaService:
    return RealYookassaService(session)

async def get_balance_service(session: SessionDep) -> BalanceService:
    return BalanceService(session)

async def get_withdrawal_service(session: SessionDep) -> WithdrawalService:
    return WithdrawalService(session)

async def get_payment_facade(session: SessionDep) -> PaymentFacadeService:
    return PaymentFacadeService(session)

async def get_purchase_service(session: SessionDep) -> PurchaseService:
    return PurchaseService(session)


PromoServiceDep = Annotated[PromoCodeService, Depends(get_promo_service)]
YooKassaServiceDep = Annotated[RealYookassaService, Depends(get_yookassa_service)]
BalanceServiceDep = Annotated[BalanceService, Depends(get_balance_service)]
PaymentFacadeServiceDep = Annotated[PaymentFacadeService, Depends(get_payment_facade)]
WithdrawalServiceDep = Annotated[WithdrawalService, Depends(get_withdrawal_service)]
PurchaseServiceDep = Annotated[PurchaseService, Depends(get_purchase_service)]