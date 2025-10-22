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
        from src.models.promo import UserPromoCodeModel
    
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
    
    async def apply_promo_code(self, user_id: int, purchase_amount: float = 0) -> dict:
        from src.models.users import UsersModel
        from sqlalchemy.orm import selectinload


        result = await self.session.execute(
            select(UserPromoCodeModel)
            .options(selectinload(UserPromoCodeModel.promo_code))  
            .join(PromoCodeModel)
            .where(
                and_(
                    UserPromoCodeModel.user_id == user_id,
                    UserPromoCodeModel.status == 'active',
                    UserPromoCodeModel.expires_at >= datetime.utcnow()
                )
            )
            .order_by(UserPromoCodeModel.activated_at.asc())
        )
        user_promo = result.scalar_one_or_none()

        if not user_promo:
            return {"success": False, "message": "Нет активных промокодов"}

        promo = user_promo.promo_code 

 
        user_result = await self.session.execute(
            select(UsersModel).where(UsersModel.id == user_id)
        )
        user = user_result.scalar_one_or_none()

        if not user:
            return {"success": False, "message": "Пользователь не найден"}

        try:
            bonus_amount = 0

            if promo.promo_type == 'balance':
                bonus_amount = promo.value
            elif promo.promo_type == 'percent':
                if purchase_amount < promo.min_purchase_amount:
                    return {
                        "success": False,
                        "message": f"Минимальная сумма для применения: {promo.min_purchase_amount} руб."
                    }
                bonus_amount = (purchase_amount * promo.value) / 100


            user.balance += Decimal(str(bonus_amount))


            user_promo.status = 'applied'
            user_promo.applied_at = datetime.utcnow()

   
            promo.total_discount_amount += bonus_amount
            promo.total_purchases += 1

            await self.session.commit()

            logger.info(f"PROMO_APPLIED: User {user_id} got {bonus_amount} RUB from {promo.code}")

            return {
                "success": True,
                "message": f"Баланс пополнен на {bonus_amount:.2f} руб." if promo.promo_type == 'balance' else f"Баланс пополнен на {bonus_amount:.2f} руб. ({promo.value}%)",
                "bonus_amount": bonus_amount,
                "final_amount": float(user.balance),
                "promo_code": promo.code
            }

        except Exception as e:
            await self.session.rollback()
            logger.error(f"PROMO_APPLY_ERROR: {str(e)}")
            return {"success": False, "message": "Ошибка при применении промокода"}
    
    async def create_promo_code(self, promo_data) -> PromoCodeModel:
        from src.models.promo import PromoCodeModel
        

        existing_result = await self.session.execute(
            select(PromoCodeModel).where(PromoCodeModel.code == promo_data.code)
        )
        if existing_result.scalar_one_or_none():
            raise ValueError("Промокод с таким кодом уже существует")
        

        promo = PromoCodeModel(
            code=promo_data.code.upper().strip(),
            description=promo_data.description,
            promo_type=promo_data.promo_type,  # Уже строка
            value=promo_data.value,
            max_uses=promo_data.max_uses,
            max_uses_per_user=promo_data.max_uses_per_user,
            valid_from=datetime.utcnow(),
            valid_until=promo_data.valid_until,
            min_purchase_amount=promo_data.min_purchase_amount,
            allowed_user_ids=promo_data.allowed_user_ids or []
        )
        
        self.session.add(promo)
        await self.session.commit()
        await self.session.refresh(promo)
        
        logger.info(f"PROMO_CREATED: Admin created promo code {promo.code}")
        return promo