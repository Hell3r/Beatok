import logging
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List

from src.models.withdrawal import WithdrawalModel, WithdrawalStatus
from src.models.users import UsersModel
from src.schemas.withdrawal import WithdrawalCreate, WithdrawalResponse, WithdrawalStatusResponse

logger = logging.getLogger(__name__)

MIN_WITHDRAWAL_AMOUNT = Decimal('100.00')
MAX_WITHDRAWAL_AMOUNT = Decimal('100000.00')


class WithdrawalService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def _get_user(self, user_id: int) -> UsersModel:
        result = await self.db.execute(
            select(UsersModel).where(UsersModel.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("Пользователь не найден")
        return user
    
    async def create_withdrawal(
        self,
        user_id: int,
        data: WithdrawalCreate
    ) -> WithdrawalResponse:
        
        user = await self._get_user(user_id)

        if user.balance < data.amount:
            raise ValueError("Недостаточно средств на балансе")

        if data.amount < MIN_WITHDRAWAL_AMOUNT:
            raise ValueError(f"Минимальная сумма вывода {MIN_WITHDRAWAL_AMOUNT} ₽")

        if data.amount > MAX_WITHDRAWAL_AMOUNT:
            raise ValueError(f"Максимальная сумма вывода {MAX_WITHDRAWAL_AMOUNT} ₽")

        balance_before = user.balance
        user.balance -= data.amount
        balance_after = user.balance

        withdrawal = WithdrawalModel(
            user_id=user_id,
            amount=data.amount,
            status=WithdrawalStatus.PENDING,
            card_number = data.card_number,
            description=data.description or f"Вывод на карту {data.card_number[-4:]}"
        )
        
        self.db.add(withdrawal)
        await self.db.flush()
        
        logger.info(f"WITHDRAWAL_CREATED: User {user_id} requested withdrawal of {data.amount} RUB")
        
        return WithdrawalResponse(
            id=withdrawal.id,
            amount=float(withdrawal.amount),
            status=withdrawal.status.value,
            card_number = withdrawal.card_number,
            created_at=withdrawal.created_at
        )
    
    async def get_withdrawal_status(
        self,
        withdrawal_id: int,
        user_id: int
    ) -> WithdrawalStatusResponse:
        
        result = await self.db.execute(
            select(WithdrawalModel).where(
                WithdrawalModel.id == withdrawal_id,
                WithdrawalModel.user_id == user_id
            )
        )
        withdrawal = result.scalar_one_or_none()
        
        if not withdrawal:
            raise ValueError("Запрос на вывод не найден")
        
        return WithdrawalStatusResponse(
            id=withdrawal.id,
            amount=float(withdrawal.amount),
            status=withdrawal.status.value,
            created_at=withdrawal.created_at,
            paid_at=withdrawal.paid_at,
            description=withdrawal.description
        )
    
    async def get_user_withdrawals(
        self,
        user_id: int,
        limit: int = 50,
        offset: int = 0
    ) -> List[WithdrawalStatusResponse]:
        
        result = await self.db.execute(
            select(WithdrawalModel)
            .where(WithdrawalModel.user_id == user_id)
            .order_by(WithdrawalModel.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        withdrawals = result.scalars().all()
        
        return [
            WithdrawalStatusResponse(
                id=w.id,
                amount=float(w.amount),
                status=w.status.value,
                created_at=w.created_at,
                card_number = w.card_number,
                paid_at=w.paid_at,
                description=w.description
            )
            for w in withdrawals
        ]
    
    async def get_user_withdrawals_count(self, user_id: int) -> int:
        
        result = await self.db.execute(
            select(func.count(WithdrawalModel.id))
            .where(WithdrawalModel.user_id == user_id)
        )
        return result.scalar() or 0
