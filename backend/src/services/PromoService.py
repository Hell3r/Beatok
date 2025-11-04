import logging
from sqlalchemy import select, and_, func, or_
from sqlalchemy.orm import selectinload
from datetime import datetime
from decimal import Decimal
from src.models.promo import PromoCodeModel, UserPromoCodeModel

logger = logging.getLogger(__name__)

class PromoCodeService:
    def __init__(self, session):
        self.session = session
    
    async def activate_promo_code(self, promo_code: str, user_id: int) -> dict:
        result = await self.session.execute(
            select(PromoCodeModel).where(
                and_(
                    PromoCodeModel.code == promo_code.upper(),
                    PromoCodeModel.status == 'active',
                    PromoCodeModel.valid_from <= datetime.utcnow(),
                    PromoCodeModel.valid_until >= datetime.utcnow()
                )
            )
        )
        promo = result.scalar_one_or_none()
        
        if not promo:
            return {"success": False, "message": "Промокод не найден или недействителен"}

        if promo.used_count >= promo.max_uses:
            return {"success": False, "message": "Промокод уже использован максимальное количество раз"}
        
        existing_result = await self.session.execute(
            select(UserPromoCodeModel).where(
                and_(
                    UserPromoCodeModel.user_id == user_id,
                    UserPromoCodeModel.promo_code_id == promo.id,
                    or_(
                        UserPromoCodeModel.status == 'active',
                        UserPromoCodeModel.status == 'applied'
                    )
                )
            )
        )
        if existing_result.first():
            return {"success": False, "message": "Вы уже активировали этот промокод"}

        active_count_result = await self.session.execute(
            select(func.count(UserPromoCodeModel.id)).where(
                and_(
                    UserPromoCodeModel.promo_code_id == promo.id,
                    UserPromoCodeModel.user_id == user_id,
                    UserPromoCodeModel.status == 'active'
                )
            )
        )
        active_count = active_count_result.scalar() or 0
        if active_count >= promo.max_uses_per_user:
            return {"success": False, "message": "Вы уже активировали этот промокод максимальное количество раз"}
        
        if promo.allowed_user_ids and user_id not in promo.allowed_user_ids:
            return {"success": False, "message": "Промокод недоступен для вашего аккаунта"}
        
        user_promo = UserPromoCodeModel(
            user_id=user_id,
            promo_code_id=promo.id,
            status='active',
            expires_at=promo.valid_until
        )
        
        self.session.add(user_promo)
        promo.used_count += 1
        
        await self.session.commit()
        await self.session.refresh(user_promo)
        
        logger.info(f"PROMO_ACTIVATED: User {user_id} activated {promo.code}")
        
        return {
            "success": True,
            "message": f"Промокод '{promo.code}' активирован!",
            "promo_type": promo.promo_type,
            "value": promo.value,
            "user_promo_id": user_promo.id
        }
    
    async def get_user_active_promos(self, user_id: int):
        result = await self.session.execute(
            select(UserPromoCodeModel)
            .options(selectinload(UserPromoCodeModel.promo_code))
            .where(
                and_(
                    UserPromoCodeModel.user_id == user_id,
                    UserPromoCodeModel.status == 'active',
                    UserPromoCodeModel.expires_at >= datetime.utcnow()
                )
            )
            .order_by(UserPromoCodeModel.activated_at.desc())
        )
        return result.scalars().all()
    
    async def get_applicable_promo_for_deposit(self, user_id: int, deposit_amount: float = 0) -> UserPromoCodeModel:
        """Получить активный промокод, который можно применить для пополнения"""
        active_promos = await self.get_user_active_promos(user_id)
        
        for user_promo in active_promos:
            promo = user_promo.promo_code
            
            # Проверяем минимальную сумму для процентных промокодов
            if promo.promo_type == 'percent' and deposit_amount < promo.min_purchase_amount:
                continue
                
            # Для балансовых промокодов минимальная сумма не важна
            return user_promo
        
        return None
    
    async def apply_promo_for_deposit(self, user_id: int, deposit_amount: float = 0) -> dict:
        """Применить активный промокод при пополнении баланса"""
        from src.models.users import UsersModel
        
        # Ищем активный промокод для применения
        user_promo = await self.get_applicable_promo_for_deposit(user_id, deposit_amount)
        
        if not user_promo:
            return {
                "success": True,
                "message": "Активных промокодов для применения нет",
                "bonus_amount": 0,
                "promo_applied": False,
                "promo_code": None
            }
        
        promo = user_promo.promo_code
        
        # Получаем пользователя
        user_result = await self.session.execute(
            select(UsersModel).where(UsersModel.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        
        if not user:
            return {"success": False, "message": "Пользователь не найден"}
        
        try:
            bonus_amount = 0
            
            # Рассчитываем бонус в зависимости от типа промокода
            if promo.promo_type == 'balance':
                bonus_amount = promo.value
                bonus_message = f"Бонус {bonus_amount:.2f} руб. по промокоду {promo.code}"
            elif promo.promo_type == 'percent':
                bonus_amount = (deposit_amount * promo.value) / 100
                bonus_message = f"Бонус {bonus_amount:.2f} руб. ({promo.value}%) по промокоду {promo.code}"
            else:
                return {"success": False, "message": "Неизвестный тип промокода"}
            
            # Начисляем бонус на баланс
            user.balance += Decimal(str(bonus_amount))
            
            # Помечаем промокод как примененный
            user_promo.status = 'applied'
            user_promo.applied_at = datetime.utcnow()
            
            # Обновляем статистику промокода
            promo.total_discount_amount += bonus_amount
            promo.total_purchases += 1
            
            await self.session.commit()
            
            logger.info(f"PROMO_APPLIED_FOR_DEPOSIT: User {user_id} got {bonus_amount} RUB from {promo.code}")
            
            return {
                "success": True,
                "message": bonus_message,
                "bonus_amount": bonus_amount,
                "promo_applied": True,
                "promo_code": promo.code,
                "new_balance": float(user.balance)
            }
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"PROMO_APPLY_ERROR: {str(e)}")
            return {"success": False, "message": "Ошибка при применении промокода"}