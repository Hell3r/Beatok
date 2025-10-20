import logging
from sqlalchemy import select, and_, func
from datetime import datetime
from decimal import Decimal
from src.models.promo import PromoCodeModel, UserPromoCodeModel, PromoType

logger = logging.getLogger(__name__)

class PromoCodeService:
    def __init__(self, session):
        self.session = session
    
    async def activate_promo_code(self, promo_code: str, user_id: int) -> dict:
        from src.models.promo import PromoCodeModel, UserPromoCodeModel, UserPromoStatus, PromoStatus
        
        result = await self.session.execute(
            select(PromoCodeModel).where(
                and_(
                    PromoCodeModel.code == promo_code.upper(),
                    PromoCodeModel.status == PromoStatus.ACTIVE,
                    PromoCodeModel.valid_from <= datetime.utcnow(),
                    PromoCodeModel.valid_until >= datetime.utcnow()
                )
            )
        )
        promo = result.scalar_one_or_none()
        
        if not promo:
            return {"success": False, "message": "Промокод не найден или недействителен"}
        

        validation_result = await self._validate_promo_activation(promo, user_id)
        if not validation_result["success"]:
            return validation_result
        

        user_promo = UserPromoCodeModel(
            user_id=user_id,
            promo_code_id=promo.id,
            status=UserPromoStatus.ACTIVE,
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
    
    async def _validate_promo_activation(self, promo: PromoCodeModel, user_id: int) -> dict:
        from src.models.promo import UserPromoCodeModel, UserPromoStatus
        
        if promo.used_count >= promo.max_uses:
            return {"success": False, "message": "Промокод уже использован максимальное количество раз"}
        
        existing_result = await self.session.execute(
            select(UserPromoCodeModel).where(
                and_(
                    UserPromoCodeModel.user_id == user_id,
                    UserPromoCodeModel.promo_code_id == promo.id,
                    UserPromoCodeModel.status == UserPromoStatus.ACTIVE
                )
            )
        )
        if existing_result.scalar_one_or_none():
            return {"success": False, "message": "Вы уже активировали этот промокод"}
        
        active_count = await self._get_user_active_promos_count(promo.id, user_id)
        if active_count >= promo.max_uses_per_user:
            return {"success": False, "message": "Вы уже активировали этот промокод максимальное количество раз"}
        
        
        if promo.allowed_user_ids and user_id not in promo.allowed_user_ids:
            return {"success": False, "message": "Промокод недоступен для вашего аккаунта"}
        
        return {"success": True}
    
    async def _get_user_active_promos_count(self, promo_id: int, user_id: int) -> int:
        from src.models.promo import UserPromoCodeModel, UserPromoStatus
        
        result = await self.session.execute(
            select(func.count(UserPromoCodeModel.id)).where(
                and_(
                    UserPromoCodeModel.promo_code_id == promo_id,
                    UserPromoCodeModel.user_id == user_id,
                    UserPromoCodeModel.status == UserPromoStatus.ACTIVE
                )
            )
        )
        return result.scalar() or 0
    
    async def get_user_active_promos(self, user_id: int):
        from src.models.promo import UserPromoCodeModel, UserPromoStatus
        
        result = await self.session.execute(
            select(UserPromoCodeModel).where(
                and_(
                    UserPromoCodeModel.user_id == user_id,
                    UserPromoCodeModel.status == UserPromoStatus.ACTIVE,
                    UserPromoCodeModel.expires_at >= datetime.utcnow()
                )
            ).order_by(UserPromoCodeModel.activated_at.desc())
        )
        return result.scalars().all()
    
    async def apply_promo_code(self, user_id: int, purchase_amount: float = 0) -> dict:
        from src.models.promo import UserPromoCodeModel, UserPromoStatus, PromoCodeModel, PromoCodeUsageModel
        from src.models.users import UsersModel
        
        
        result = await self.session.execute(
            select(UserPromoCodeModel).join(PromoCodeModel).where(
                and_(
                    UserPromoCodeModel.user_id == user_id,
                    UserPromoCodeModel.status == UserPromoStatus.ACTIVE,
                    UserPromoCodeModel.expires_at >= datetime.utcnow()
                )
            ).order_by(UserPromoCodeModel.activated_at.asc())
        )
        user_promo = result.scalar_one_or_none()
        
        if not user_promo:
            return {"success": False, "message": "Нет активных промокодов"}
        
        promo = user_promo.promo_code
        
        if promo.promo_type in [PromoType.DISCOUNT, PromoType.PERCENT] and purchase_amount < promo.min_purchase_amount:
            return {
                "success": False,
                "message": f"Минимальная сумма для применения: {promo.min_purchase_amount} руб."
            }
        
        try:
            if promo.promo_type == PromoType.BALANCE:
                return await self._apply_balance_promo(promo, user_promo, user_id)
            elif promo.promo_type in [PromoType.DISCOUNT, PromoType.PERCENT]:
                return await self._apply_discount_promo(promo, user_promo, user_id, purchase_amount)
            else:
                return {"success": False, "message": "Неизвестный тип промокода"}
                
        except Exception as e:
            await self.session.rollback()
            logger.error(f"PROMO_APPLY_ERROR: {str(e)}")
            return {"success": False, "message": "Ошибка при применении промокода"}
    
    async def _apply_balance_promo(self, promo: PromoCodeModel, user_promo: UserPromoCodeModel, user_id: int) -> dict:
        from src.models.users import UsersModel
        from src.models.promo import PromoCodeUsageModel, UserPromoStatus
        

        user_result = await self.session.execute(
            select(UsersModel).where(UsersModel.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        
        if not user:
            return {"success": False, "message": "Пользователь не найден"}

        user.balance += Decimal(str(promo.value))
        

        usage = PromoCodeUsageModel(
            promo_code_id=promo.id,
            user_id=user_id,
            user_promo_id=user_promo.id,
            discount_amount=promo.value,
            final_amount=float(user.balance)
        )
        self.session.add(usage)
        

        user_promo.status = UserPromoStatus.APPLIED
        user_promo.applied_at = datetime.utcnow()
        

        promo.total_discount_amount += promo.value
        
        await self.session.commit()
        
        logger.info(f" PROMO_BALANCE_APPLIED: User {user_id} got {promo.value} RUB from {promo.code}")
        
        return {
            "success": True,
            "message": f"Баланс пополнен на {promo.value} руб.",
            "bonus_amount": promo.value,
            "promo_type": PromoType.BALANCE,
            "final_amount": float(user.balance),
            "promo_code": promo.code,
            "user_promo_id": user_promo.id
        }
    
    async def _apply_discount_promo(self, promo: PromoCodeModel, user_promo: UserPromoCodeModel, 
                                  user_id: int, purchase_amount: float) -> dict:

        from src.models.promo import PromoCodeUsageModel, UserPromoStatus
        

        if promo.promo_type == PromoType.PERCENT:
            discount_amount = (purchase_amount * promo.value) / 100
        else:  
            discount_amount = min(promo.value, purchase_amount)
        
        final_amount = purchase_amount - discount_amount


        usage = PromoCodeUsageModel(
            promo_code_id=promo.id,
            user_id=user_id,
            user_promo_id=user_promo.id,
            discount_amount=discount_amount,
            purchase_amount=purchase_amount,
            final_amount=final_amount
        )
        self.session.add(usage)
        

        user_promo.status = UserPromoStatus.APPLIED
        user_promo.applied_at = datetime.utcnow()
        

        promo.total_purchases += 1
        promo.total_discount_amount += discount_amount
        
        await self.session.commit()
        
        logger.info(f" PROMO_DISCOUNT_APPLIED: User {user_id} got {discount_amount} RUB discount from {promo.code}")
        
        return {
            "success": True,
            "message": f"Применена скидка {discount_amount:.2f} руб." if promo.promo_type == PromoType.DISCOUNT else f"Применена скидка {promo.value}%",
            "discount_amount": discount_amount,
            "promo_type": promo.promo_type,
            "final_amount": final_amount,
            "promo_code": promo.code,
            "user_promo_id": user_promo.id
        }
    
    async def get_user_promo_history(self, user_id: int, limit: int = 20):
        from src.models.promo import PromoCodeUsageModel
        
        result = await self.session.execute(
            select(PromoCodeUsageModel)
            .where(PromoCodeUsageModel.user_id == user_id)
            .order_by(PromoCodeUsageModel.applied_at.desc())
            .limit(limit)
        )
        return result.scalars().all()
    
    async def create_promo_code(self, promo_data) -> PromoCodeModel:
        from src.models.promo import PromoCodeModel
        

        existing_result = await self.session.execute(
            select(PromoCodeModel).where(PromoCodeModel.code == promo_data.code)
        )
        if existing_result.scalar_one_or_none():
            raise ValueError("Промокод с таким кодом уже существует")
        
        promo_dict = promo_data.dict()
        promo = PromoCodeModel(**promo_dict)
        
        self.session.add(promo)
        await self.session.commit()
        await self.session.refresh(promo)
        
        logger.info(f" PROMO_CREATED: Admin created promo code {promo.code}")
        return promo