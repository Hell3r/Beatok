import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal
from typing import Optional, List
from src.models.users import UsersModel
from src.models.balance import UserBalanceModel, BalanceOperationType

logger = logging.getLogger(__name__)

class BalanceService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def _get_user(self, user_id: int) -> UsersModel:
        result = await self.db.execute(
            select(UsersModel)
            .where(UsersModel.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("Пользователь не найден")
        return user
    
    async def get_balance(self, user_id: int) -> Decimal:
        user = await self._get_user(user_id)
        return user.balance
    
    async def deposit(self, user_id: int, amount: Decimal, description: str = None) -> Decimal:
        if amount <= 0:
            raise ValueError("Сумма пополнения должна быть положительной")
        
        user = await self._get_user(user_id)
        
        balance_before = user.balance
        user.balance += amount
        balance_after = user.balance
        
        operation = UserBalanceModel(
            user_id=user_id,
            operation_type=BalanceOperationType.DEPOSIT,
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            description=description or f"Пополнение баланса"
        )
        
        self.db.add(operation)
        await self.db.flush()
        
        logger.info(f"BALANCE_DEPOSIT: User {user_id} deposited {amount} RUB")
        
        return balance_after
    
    async def add_bonus(self, user_id: int, amount: Decimal, description: str = None) -> Decimal:
        if amount <= 0:
            raise ValueError("Сумма бонуса должна быть положительной")
        
        user = await self._get_user(user_id)
        
        balance_before = user.balance
        user.balance += amount
        balance_after = user.balance
        
        operation = UserBalanceModel(
            user_id=user_id,
            operation_type=BalanceOperationType.BONUS,
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            description=description or f"Бонусные средства"
        )
        
        self.db.add(operation)
        await self.db.flush()
        
        logger.info(f"BALANCE_BONUS: User {user_id} got bonus {amount} RUB")
        
        return balance_after
    
    async def get_balance_history(self, user_id: int, skip: int = 0, limit: int = 50) -> List[UserBalanceModel]:
        result = await self.db.execute(
            select(UserBalanceModel)
            .where(UserBalanceModel.user_id == user_id)
            .order_by(UserBalanceModel.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        
        return result.scalars().all()