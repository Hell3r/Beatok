import logging
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from typing import List, Optional, Any
from datetime import datetime

from src.models.withdrawal import WithdrawalModel, WithdrawalStatus
from src.models.users import UsersModel
from src.schemas.withdrawal import WithdrawalCreate, WithdrawalUpdate

logger = logging.getLogger(__name__)

class WithdrawalService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.fee_percentage = Decimal('2.5')
        self.min_fee = Decimal('10.00')

    def calculate_fee(self, amount: Decimal) -> Decimal:
        fee = (amount * self.fee_percentage) / Decimal('100')
        return max(fee, self.min_fee)

    async def create_withdrawal(
        self, 
        withdrawal_data: WithdrawalCreate, 
        user_id: int
    ) -> WithdrawalModel:
        try:
            result = await self.db.execute(
                select(UsersModel).where(UsersModel.id == user_id)
            )
            user = result.scalar_one_or_none()
            
            if not user:
                raise ValueError("Пользователь не найден")
            
            if user.balance < withdrawal_data.amount:
                raise ValueError("Недостаточно средств на балансе")

            if withdrawal_data.amount < Decimal('50.00'):
                raise ValueError("Минимальная сумма вывода 50 рублей")

            fee = self.calculate_fee(withdrawal_data.amount)
            net_amount = withdrawal_data.amount - fee

            if net_amount <= Decimal('0'):
                raise ValueError("Сумма к выплате после комиссии должна быть положительной")

            withdrawal = WithdrawalModel(
                user_id=user_id,
                amount=withdrawal_data.amount,
                fee=fee,
                net_amount=net_amount,
                card_number=withdrawal_data.card_number.replace(' ', ''),
                cardholder_name=withdrawal_data.cardholder_name,
                status=WithdrawalStatus.PENDING
            )

            self.db.add(withdrawal)

            user.balance -= withdrawal_data.amount
            
            await self.db.commit()
            await self.db.refresh(withdrawal)
            
            logger.info(f"Withdrawal created: ID {withdrawal.id}, User {user_id}, Amount {withdrawal_data.amount}")
            
            return withdrawal

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating withdrawal: {str(e)}")
            raise ValueError(f"Ошибка создания вывода: {str(e)}")

    async def process_withdrawal(self, withdrawal_id: int, yookassa_service: Any) -> WithdrawalModel:
        try:
            result = await self.db.execute(
                select(WithdrawalModel).where(
                    WithdrawalModel.id == withdrawal_id,
                    WithdrawalModel.status == WithdrawalStatus.PENDING
                )
            )
            withdrawal = result.scalar_one_or_none()
    
            if not withdrawal:
                raise ValueError("Заявка на вывод не найдена или уже обработана")
    
            logger.info(f"Processing withdrawal: ID {withdrawal_id}, Amount {withdrawal.net_amount}")
    
            try:
                payout_available = await yookassa_service.check_payouts_availability()
            except:
                payout_available = False
    
            payment_result = None
            
            if payout_available:
                try:
                    logger.info("Using Payouts API for withdrawal")
                    payment_result = await yookassa_service.create_simple_withdrawal(
                        amount=float(withdrawal.net_amount),
                        card_number=withdrawal.card_number,
                        description=f"Вывод средств #{withdrawal.id}"
                    )
                except Exception as payout_error:
                    logger.warning(f"Payouts API failed: {payout_error}")
                    payout_available = False
    
            if not payout_available:
                logger.info("Using Payment API as fallback")
                payment_result = await yookassa_service.create_withdrawal_payment(
                    amount=float(withdrawal.net_amount),
                    card_number=withdrawal.card_number,
                    description=f"Вывод средств #{withdrawal.id}"
                )

            withdrawal.status = WithdrawalStatus.PROCESSING
            withdrawal.processed_at = datetime.now()
            withdrawal.external_payment_id = payment_result.get("id")

            withdrawal.payment_type = "payout" if payout_available else "payment"
            
            await self.db.commit()
            
            logger.info(f"Withdrawal processing started: ID {withdrawal_id}, Type: {withdrawal.payment_type}, External ID: {payment_result.get('id')}")
            
            return withdrawal
    
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error processing withdrawal {withdrawal_id}: {str(e)}")
            await self.reject_withdrawal(withdrawal_id, f"Ошибка обработки: {str(e)}")
            raise ValueError(f"Ошибка при обработке выплаты: {str(e)}")

    async def complete_withdrawal(self, withdrawal_id: int) -> WithdrawalModel:
        try:
            result = await self.db.execute(
                select(WithdrawalModel).where(WithdrawalModel.id == withdrawal_id)
            )
            withdrawal = result.scalar_one_or_none()

            if not withdrawal:
                raise ValueError("Заявка на вывод не найдена")

            if withdrawal.status not in [WithdrawalStatus.PROCESSING, WithdrawalStatus.PENDING]:
                raise ValueError(f"Невозможно завершить вывод в статусе {withdrawal.status}")

            withdrawal.status = WithdrawalStatus.COMPLETED
            withdrawal.completed_at = datetime.now()
            
            await self.db.commit()
            
            logger.info(f"Withdrawal completed: ID {withdrawal_id}")
            
            return withdrawal

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error completing withdrawal {withdrawal_id}: {str(e)}")
            raise ValueError(f"Ошибка завершения вывода: {str(e)}")

    async def reject_withdrawal(
        self, 
        withdrawal_id: int, 
        reason: str = None
    ) -> WithdrawalModel:
        try:
            result = await self.db.execute(
                select(WithdrawalModel).where(
                    WithdrawalModel.id == withdrawal_id,
                    WithdrawalModel.status.in_([WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING])
                )
            )
            withdrawal = result.scalar_one_or_none()

            if not withdrawal:
                raise ValueError("Заявка на вывод не найдена или не может быть отклонена")

            user_result = await self.db.execute(
                select(UsersModel).where(UsersModel.id == withdrawal.user_id)
            )
            user = user_result.scalar_one_or_none()
            
            if user:
                user.balance += withdrawal.amount
                logger.info(f"Funds returned to user {user.id}: +{withdrawal.amount}")

            withdrawal.status = WithdrawalStatus.REJECTED
            withdrawal.rejection_reason = reason
            withdrawal.processed_at = datetime.now()
            
            await self.db.commit()
            
            logger.info(f"Withdrawal rejected: ID {withdrawal_id}, Reason: {reason}")
            
            return withdrawal

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error rejecting withdrawal {withdrawal_id}: {str(e)}")
            raise ValueError(f"Ошибка отклонения вывода: {str(e)}")

    async def fail_withdrawal(
        self, 
        withdrawal_id: int, 
        reason: str = None
    ) -> WithdrawalModel:
        try:
            result = await self.db.execute(
                select(WithdrawalModel).where(WithdrawalModel.id == withdrawal_id)
            )
            withdrawal = result.scalar_one_or_none()

            if not withdrawal:
                raise ValueError("Заявка на вывод не найдена")

            if withdrawal.status in [WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING]:
                user_result = await self.db.execute(
                    select(UsersModel).where(UsersModel.id == withdrawal.user_id)
                )
                user = user_result.scalar_one_or_none()
                
                if user:
                    user.balance += withdrawal.amount
                    logger.info(f"Funds returned to user {user.id}: +{withdrawal.amount}")

            withdrawal.status = WithdrawalStatus.FAILED
            withdrawal.rejection_reason = reason
            withdrawal.processed_at = datetime.now()
            
            await self.db.commit()
            
            logger.info(f"Withdrawal failed: ID {withdrawal_id}, Reason: {reason}")
            
            return withdrawal

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error marking withdrawal {withdrawal_id} as failed: {str(e)}")
            raise ValueError(f"Ошибка отметки вывода как неудачного: {str(e)}")

    async def get_user_withdrawals(
        self, 
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[WithdrawalModel]:
        try:
            result = await self.db.execute(
                select(WithdrawalModel)
                .where(WithdrawalModel.user_id == user_id)
                .order_by(WithdrawalModel.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
            withdrawals = result.scalars().all()
            
            logger.debug(f"Retrieved {len(withdrawals)} withdrawals for user {user_id}")
            
            return withdrawals

        except Exception as e:
            logger.error(f"Error getting user withdrawals for user {user_id}: {str(e)}")
            return []

    async def get_withdrawal_by_id(self, withdrawal_id: int) -> Optional[WithdrawalModel]:
        try:
            result = await self.db.execute(
                select(WithdrawalModel).where(WithdrawalModel.id == withdrawal_id)
            )
            withdrawal = result.scalar_one_or_none()
            
            return withdrawal

        except Exception as e:
            logger.error(f"Error getting withdrawal {withdrawal_id}: {str(e)}")
            return None

    async def get_pending_withdrawals(self) -> List[WithdrawalModel]:
        try:
            result = await self.db.execute(
                select(WithdrawalModel)
                .where(WithdrawalModel.status == WithdrawalStatus.PENDING)
                .order_by(WithdrawalModel.created_at.asc())
            )
            withdrawals = result.scalars().all()
            
            logger.info(f"Retrieved {len(withdrawals)} pending withdrawals")
            
            return withdrawals

        except Exception as e:
            logger.error(f"Error getting pending withdrawals: {str(e)}")
            return []

    async def get_withdrawal_stats(self, user_id: int = None) -> dict:
        try:
            query = select(
                func.count(WithdrawalModel.id).label('total_withdrawals'),
                func.coalesce(func.sum(WithdrawalModel.amount), 0).label('total_amount'),
                func.count(WithdrawalModel.id).filter(
                    WithdrawalModel.status == WithdrawalStatus.PENDING
                ).label('pending_count'),
                func.count(WithdrawalModel.id).filter(
                    WithdrawalModel.status == WithdrawalStatus.PROCESSING
                ).label('processing_count'),
                func.count(WithdrawalModel.id).filter(
                    WithdrawalModel.status == WithdrawalStatus.COMPLETED
                ).label('completed_count'),
                func.count(WithdrawalModel.id).filter(
                    WithdrawalModel.status.in_([WithdrawalStatus.FAILED, WithdrawalStatus.REJECTED])
                ).label('failed_count')
            )

            if user_id:
                query = query.where(WithdrawalModel.user_id == user_id)

            result = await self.db.execute(query)
            stats = result.first()
            
            stats_dict = {
                'total_withdrawals': stats.total_withdrawals or 0,
                'total_amount': stats.total_amount or Decimal('0'),
                'pending_count': stats.pending_count or 0,
                'processing_count': stats.processing_count or 0,
                'completed_count': stats.completed_count or 0,
                'failed_count': stats.failed_count or 0
            }
            
            logger.debug(f"Withdrawal stats: {stats_dict}")
            
            return stats_dict

        except Exception as e:
            logger.error(f"Error getting withdrawal stats: {str(e)}")
            return {
                'total_withdrawals': 0,
                'total_amount': Decimal('0'),
                'pending_count': 0,
                'processing_count': 0,
                'completed_count': 0,
                'failed_count': 0
            }

    async def cancel_withdrawal(self, withdrawal_id: int, user_id: int = None) -> WithdrawalModel:
        try:
            query = select(WithdrawalModel).where(
                WithdrawalModel.id == withdrawal_id,
                WithdrawalModel.status == WithdrawalStatus.PENDING
            )
            
            if user_id:
                query = query.where(WithdrawalModel.user_id == user_id)
                
            result = await self.db.execute(query)
            withdrawal = result.scalar_one_or_none()

            if not withdrawal:
                raise ValueError("Заявка на вывод не найдена или не может быть отменена")

            user_result = await self.db.execute(
                select(UsersModel).where(UsersModel.id == withdrawal.user_id)
            )
            user = user_result.scalar_one_or_none()
            
            if user:
                user.balance += withdrawal.amount

            withdrawal.status = WithdrawalStatus.REJECTED
            withdrawal.rejection_reason = "Отменено пользователем"
            withdrawal.processed_at = datetime.now()
            
            await self.db.commit()
            
            logger.info(f"Withdrawal cancelled by user: ID {withdrawal_id}")
            
            return withdrawal

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error cancelling withdrawal {withdrawal_id}: {str(e)}")
            raise ValueError(f"Ошибка отмены вывода: {str(e)}")

    async def get_withdrawal_by_external_id(self, external_payment_id: str) -> Optional[WithdrawalModel]:
        try:
            result = await self.db.execute(
                select(WithdrawalModel).where(WithdrawalModel.external_payment_id == external_payment_id)
            )
            withdrawal = result.scalar_one_or_none()
            
            return withdrawal

        except Exception as e:
            logger.error(f"Error getting withdrawal by external ID {external_payment_id}: {str(e)}")
            return None