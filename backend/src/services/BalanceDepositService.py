import logging
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.users import UsersModel
from sqlalchemy import select
from backend.src.services.BalanceService import BalanceService
from src.services.PromoService import PromoCodeService

logger = logging.getLogger(__name__)

class BalanceDepositService:
    def __init__(self, db: AsyncSession, promo_service: PromoCodeService):
        self.db = db
        self.balance_service = BalanceService(db)
        self.promo_service = promo_service
    
    async def deposit_balance(self, user_id: int, deposit_amount: float) -> dict:
        try:
            new_balance = await self.balance_service.deposit(
                user_id, 
                Decimal(str(deposit_amount)), 
            )
            base_balance = float(new_balance)
            
            promo_result = await self.promo_service.apply_promo_for_deposit(user_id, deposit_amount)
            
            if not promo_result["success"]:
                await self.db.commit()
                return {
                    "success": True,
                    "message": f"Баланс пополнен на {deposit_amount:.2f} руб.",
                    "deposit_amount": deposit_amount,
                    "bonus_amount": 0,
                    "total_amount": deposit_amount,
                    "new_balance": base_balance,
                    "promo_applied": False
                }
            
            await self.db.commit()
            

            if promo_result["promo_applied"]:
                return {
                    "success": True,
                    "message": f"Баланс пополнен на {deposit_amount:.2f} руб. + {promo_result['bonus_amount']:.2f} руб. бонус",
                    "deposit_amount": deposit_amount,
                    "bonus_amount": promo_result["bonus_amount"],
                    "total_amount": deposit_amount + promo_result["bonus_amount"],
                    "new_balance": promo_result["new_balance"],
                    "promo_applied": True,
                    "promo_code": promo_result["promo_code"]
                }
            else:
                return {
                    "success": True,
                    "message": f"Баланс пополнен на {deposit_amount:.2f} руб.",
                    "deposit_amount": deposit_amount,
                    "bonus_amount": 0,
                    "total_amount": deposit_amount,
                    "new_balance": base_balance,
                    "promo_applied": False
                }
                
        except Exception as e:
            await self.db.rollback()
            logger.error(f"DEPOSIT_ERROR: {str(e)}")
            return {"success": False, "message": "Ошибка при пополнении баланса"}