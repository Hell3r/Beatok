import logging
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.yookassa_config import yookassa_settings
from src.services.PaymentService import RealYookassaService
from typing import Optional

logger = logging.getLogger(__name__)

class PaymentFacadeService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.use_real_yookassa = not yookassa_settings.YOOKASSA_TEST_MODE
        
        self.payment_service = RealYookassaService(db)
        
        logger.info(f"Payment service initialized in TEST mode: {yookassa_settings.YOOKASSA_TEST_MODE}")
    
    
    
    async def create_payment(self, user_id: int, amount: Decimal, description: str = None) -> dict:
        logger.info(f"Creating payment for user {user_id}, amount: {amount}, test_mode: {yookassa_settings.YOOKASSA_TEST_MODE}")
        
        try:
            return await self.payment_service.create_payment(user_id, amount, description)
        except Exception as e:
            logger.error(f"PAYMENT_CREATION_ERROR: {str(e)}")
            raise
    
    async def handle_webhook(self, webhook_data: dict) -> bool:
        return await self.payment_service.handle_webhook(webhook_data)
    
    async def get_payment_status(self, payment_id: int) -> Optional[dict]:
        return await self.payment_service.get_payment_status(payment_id)