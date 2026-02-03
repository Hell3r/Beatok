import logging
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.yookassa_config import yookassa_settings
from src.services.PaymentService import RealYookassaService
from src.services.PromotionService import PromotionService
from typing import Optional

logger = logging.getLogger(__name__)

class PaymentFacadeService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.use_real_yookassa = not yookassa_settings.YOOKASSA_TEST_MODE
        
        self.payment_service = RealYookassaService(db)
        self.promotion_service = PromotionService(db)
        
        logger.info(f"Payment service initialized in TEST mode: {yookassa_settings.YOOKASSA_TEST_MODE}")
    
    async def create_promotion_payment(
        self, 
        user_id: int, 
        promotion_id: int,
        beat_name: str = None
    ) -> dict:
        logger.info(f"Creating promotion payment: user={user_id}, promotion={promotion_id}")
        
        try:
            promotion_price = self.promotion_service.PROMOTION_PRICE
            
            payment_result = await self.payment_service.create_payment(
                user_id=user_id,
                amount=Decimal(str(promotion_price)),
                description=f"Продвижение бита {beat_name or f'#{promotion_id}'} на 3 дня"
            )
            
            from src.models.promotion import BeatPromotionModel
            from src.models.payment import PaymentModel
            from sqlalchemy import select
            
            promotion = await self.db.get(BeatPromotionModel, promotion_id)
            if not promotion:
                raise ValueError(f"Promotion {promotion_id} not found")
            
            db_payment = await self.db.execute(
                select(PaymentModel).where(
                    PaymentModel.external_payment_id == payment_result["external_payment_id"]
                )
            )
            db_payment = db_payment.scalar_one()
            

            promotion.payment_id = db_payment.id
            
            await self.db.commit()
            
            logger.info(f"Promotion payment created: {payment_result['id']}")
            
            return {
                **payment_result,
                "promotion_price": promotion_price,
                "duration_days": 3
            }
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"PROMOTION_PAYMENT_CREATION_ERROR: {str(e)}")
            raise
    
    async def handle_webhook(self, webhook_data: dict) -> bool:
        success = await self.payment_service.handle_webhook(webhook_data)
        
        if success:
            try:
                # Получаем ID платежа из webhook данных
                notification = webhook_data.get('object', {})
                payment_id = notification.get('id')
                
                if payment_id:
                    # Ищем платеж в нашей базе
                    from src.models.payment import PaymentModel
                    from sqlalchemy import select
                    
                    result = await self.db.execute(
                        select(PaymentModel).where(
                            PaymentModel.external_payment_id == payment_id
                        )
                    )
                    db_payment = result.scalar_one_or_none()
                    
                    if db_payment and db_payment.status == PaymentStatus.SUCCEEDED:
                        if db_payment.description and "продвижение" in db_payment.description.lower():
                            await self.promotion_service.activate_promotion(db_payment.id)
                            
            except Exception as e:
                logger.error(f"Error processing promotion in webhook: {str(e)}")
        
        return success
    
    async def create_payment(self, user_id: int, amount: Decimal, description: str = None) -> dict:
        return await self.payment_service.create_payment(user_id, amount, description)
    
    async def get_payment_status(self, payment_id: int) -> Optional[dict]:
        return await self.payment_service.get_payment_status(payment_id)
    
    async def get_promotion_price_info(self) -> dict:
        info = await self.promotion_service.get_promotion_price_info()
        return {
            "price": info.price,
            "duration_days": info.duration_days,
            "description": info.description
        }