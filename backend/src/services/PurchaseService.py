import logging
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, update
from typing import Optional
from datetime import datetime
from typing import List
from src.models.purchase import PurchaseModel
from src.models.users import UsersModel
from src.models.beats import BeatModel, StatusType
from src.models.beat_pricing import BeatPricingModel
from src.models.tarrifs import TariffTemplateModel, TariffType
from src.services.BalanceService import BalanceService

logger = logging.getLogger(__name__)

class PurchaseService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.balance_service = BalanceService(db)

    async def purchase_beat(
        self, 
        beat_id: int, 
        tariff_name: str,
        purchaser_id: int
    ) -> dict:
        try:
            purchaser_result = await self.db.execute(
                select(UsersModel).where(UsersModel.id == purchaser_id)
            )
            purchaser = purchaser_result.scalar_one_or_none()
            
            if not purchaser:
                raise ValueError("Покупатель не найден")

            beat_result = await self.db.execute(
                select(BeatModel).where(
                    BeatModel.id == beat_id,
                    BeatModel.status == StatusType.AVAILABLE
                )
            )
            beat = beat_result.scalar_one_or_none()
            
            if not beat:
                raise ValueError("Бит не найден или недоступен для покупки")

            if beat.author_id == purchaser_id:
                raise ValueError("Нельзя купить собственный бит")

            pricing_result = await self.db.execute(
                select(BeatPricingModel, TariffTemplateModel)
                .join(TariffTemplateModel, TariffTemplateModel.name == BeatPricingModel.tariff_name)
                .where(
                    BeatPricingModel.beat_id == beat_id,
                    BeatPricingModel.tariff_name == tariff_name,
                    BeatPricingModel.is_available == True
                )
            )
            
            pricing_data = pricing_result.first()
            
            if not pricing_data:
                raise ValueError("Выбранный тариф недоступен для этого бита")
            
            beat_pricing, tariff = pricing_data
            
            if not beat_pricing.price:
                raise ValueError("Цена не установлена для этого тарифа")
            
            price = Decimal(str(beat_pricing.price))

            if tariff.type == TariffType.EXCLUSIVE:
                exclusive_purchase_result = await self.db.execute(
                    select(PurchaseModel).where(
                        PurchaseModel.beat_id == beat_id,
                        PurchaseModel.tariff_name == tariff_name,
                        PurchaseModel.status == "completed"
                    )
                )
                
                if exclusive_purchase_result.scalar_one_or_none():
                    raise ValueError("Этот бит уже продан по эксклюзивному тарифу")

            if purchaser.balance < price:
                raise ValueError("Недостаточно средств на балансе")

            seller_result = await self.db.execute(
                select(UsersModel).where(UsersModel.id == beat.author_id)
            )
            seller = seller_result.scalar_one_or_none()
            
            if not seller:
                raise ValueError("Автор бита не найден")

            purchaser_balance_before = purchaser.balance
            seller_balance_before = seller.balance

            purchaser.balance -= price
            

            await self.balance_service.deposit(
                user_id=seller.id,
                amount=price,
                description=f"Продажа бита: {beat.name} ({tariff.display_name})"
            )

            purchase = PurchaseModel(
                purchaser_id=purchaser_id,
                seller_id=seller.id,
                beat_id=beat_id,
                tariff_name=tariff_name,
                amount=price,
                status="completed",
                transaction_id=f"purchase_{datetime.utcnow().timestamp()}",
                created_at=datetime.utcnow()
            )
            
            self.db.add(purchase)

            if tariff.type == TariffType.EXCLUSIVE:
                beat.status = StatusType.SOLD

                await self.db.execute(
                    update(BeatPricingModel)
                    .where(BeatPricingModel.beat_id == beat_id)
                    .values(is_available=False)
                )
                
                logger.info(f"Бит {beat_id} продан по эксклюзивному тарифу, скрыт из продажи")
            else:

                logger.info(f"Бит {beat_id} продан по лизинговому тарифу, остается в продаже")
            
            await self.db.commit()

            result = {
                "success": True,
                "purchase_id": purchase.id,
                "beat_id": beat_id,
                "beat_name": beat.name,
                "tariff_name": tariff.display_name,
                "tariff_type": tariff.type.value,
                "amount": float(price),
                "purchaser_balance_before": float(purchaser_balance_before),
                "purchaser_balance_after": float(purchaser.balance),
                "seller_balance_before": float(seller_balance_before),
                "seller_balance_after": float(seller.balance),
                "message": "Покупка успешно завершена",
                "purchased_at": purchase.created_at
            }
            
            if tariff.type == TariffType.EXCLUSIVE:
                result["message"] += ". Вы получили эксклюзивные права на этот бит."
            else:
                result["message"] += ". Бит доступен по лицензии."
            
            logger.info(f"Purchase completed: Beat {beat_id}, Tariff {tariff_name}, Amount {price}")
            
            return result
            
        except ValueError as e:
            await self.db.rollback()
            logger.error(f"Validation error in purchase: {str(e)}")
            raise ValueError(str(e))
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Unexpected error in purchase: {str(e)}")
            raise ValueError(f"Ошибка при покупке: {str(e)}")

    async def get_available_tariffs_for_beat(self, beat_id: int, user_id: int) -> List[dict]:

        try:
            # Проверяем, что бит существует и активен
            beat_result = await self.db.execute(
                select(BeatModel).where(
                    BeatModel.id == beat_id,
                    BeatModel.status == StatusType.AVAILABLE
                )
            )
            beat = beat_result.scalar_one_or_none()
            
            if not beat:
                return []

            if beat.author_id == user_id:
                return []

            result = await self.db.execute(
                select(BeatPricingModel, TariffTemplateModel)
                .join(TariffTemplateModel, TariffTemplateModel.name == BeatPricingModel.tariff_name)
                .where(
                    BeatPricingModel.beat_id == beat_id,
                    BeatPricingModel.is_available == True,
                    BeatPricingModel.price.isnot(None)
                )
            )
            
            tariffs = []
            for beat_pricing, tariff in result:
                if tariff.type == TariffType.EXCLUSIVE:
                    exclusive_result = await self.db.execute(
                        select(PurchaseModel).where(
                            PurchaseModel.beat_id == beat_id,
                            PurchaseModel.tariff_name == tariff.name,
                            PurchaseModel.status == "completed"
                        )
                    )
                    
                    if exclusive_result.scalar_one_or_none():
                        continue
                
                tariffs.append({
                    "tariff_name": tariff.name,
                    "display_name": tariff.display_name,
                    "description": tariff.description,
                    "type": tariff.type.value,
                    "price": float(beat_pricing.price) if beat_pricing.price else 0.0,
                    "is_available": beat_pricing.is_available
                })
            
            return tariffs
            
        except Exception as e:
            logger.error(f"Error getting available tariffs: {str(e)}")
            return []

    async def get_user_purchases(self, user_id: int) -> List[dict]:
        try:
            result = await self.db.execute(
                select(PurchaseModel, BeatModel, TariffTemplateModel)
                .join(BeatModel, BeatModel.id == PurchaseModel.beat_id)
                .join(TariffTemplateModel, TariffTemplateModel.name == PurchaseModel.tariff_name)
                .where(
                    PurchaseModel.purchaser_id == user_id,
                    PurchaseModel.status == "completed"
                )
                .order_by(PurchaseModel.created_at.desc())
            )
            
            purchases = []
            for purchase, beat, tariff in result:
                purchases.append({
                    "purchase_id": purchase.id,
                    "beat_id": beat.id,
                    "beat_name": beat.name,
                    "beat_genre": beat.genre,
                    "tariff_name": tariff.display_name,
                    "tariff_type": tariff.type.value,
                    "amount": float(purchase.amount),
                    "purchased_at": purchase.created_at,
                    "is_exclusive": tariff.type == TariffType.EXCLUSIVE
                })
            
            return purchases
            
        except Exception as e:
            logger.error(f"Error getting user purchases: {str(e)}")
            return []