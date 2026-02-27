import logging
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_
from typing import List, Optional
from src.models.beats import BeatModel
from src.models.promotion import BeatPromotionModel
from src.models.users import UsersModel
from src.services.BalanceService import BalanceService

logger = logging.getLogger(__name__)

class PromotionService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    PROMOTION_PRICE = 150.0
    PROMOTION_DURATION_DAYS = 3
    PROMOTION_DESCRIPTION = "Продвижение бита на 3 дня в топе"
    
    async def promote_beat(
        self, 
        user_id: int, 
        beat_id: int
    ) -> dict:

        try:
            beat = await self.db.get(BeatModel, beat_id)
            if not beat:
                raise ValueError(f"Бит с ID {beat_id} не найден")
            
            if beat.author_id != user_id:
                raise ValueError("Вы не являетесь владельцем этого бита")
            
            if beat.status == "SOLD":
                raise ValueError("Нельзя продвигать проданный бит")
            
            active_promotion = await self._get_active_promotion(beat_id)
            if active_promotion:
                days_left = active_promotion.days_remaining
                raise ValueError(
                    f"У этого бита уже есть активное продвижение. "
                    f"Осталось: {days_left} дней"
                )
            
            user = await self.db.get(UsersModel, user_id)
            if not user:
                raise ValueError("Пользователь не найден")
            
            if user.balance < self.PROMOTION_PRICE:
                raise ValueError(
                    f"Недостаточно средств на балансе. "
                    f"Нужно: {self.PROMOTION_PRICE} ₽, "
                    f"на балансе: {user.balance} ₽"
                )
            
            user.balance -= 150

            promotion = BeatPromotionModel(
                beat_id=beat_id,
                user_id=user_id,
                price=self.PROMOTION_PRICE,
                starts_at=datetime.utcnow(),
                ends_at=datetime.utcnow() + timedelta(days=self.PROMOTION_DURATION_DAYS),
                is_active=True
            )
            
            self.db.add(promotion)

            beat.promotion_status = "promoted"
            
            await self.db.commit()
            
            logger.info(
                f"✅ Beat promoted: beat_id={beat_id}, user_id={user_id}, "
                f"price={self.PROMOTION_PRICE}, ends_at={promotion.ends_at}"
            )
            
            return {
                "success": True,
                "message": "Бит успешно продвинут на 3 дня",
                "beat_id": beat_id,
                "beat_name": beat.name,
                "price": self.PROMOTION_PRICE,
                "ends_at": promotion.ends_at,
                "promotion_id": promotion.id
            }
            
        except ValueError as e:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error promoting beat: {str(e)}")
            raise ValueError("Ошибка при продвижении бита")
    
    async def check_expired_promotions(self):
        try:
            current_time = datetime.utcnow()

            result = await self.db.execute(
                select(BeatPromotionModel).where(
                    and_(
                        BeatPromotionModel.is_active == True,
                        BeatPromotionModel.ends_at < current_time
                    )
                )
            )
            expired_promotions = result.scalars().all()
            
            if not expired_promotions:
                logger.debug("No expired promotions found")
                return 0
            
            beat_ids_to_update = set()
            deactivated_count = 0
            
            for promotion in expired_promotions:
                promotion.is_active = False
                beat_ids_to_update.add(promotion.beat_id)
                deactivated_count += 1
                
                logger.info(
                    f"Promotion expired: promotion_id={promotion.id}, "
                    f"beat_id={promotion.beat_id}"
                )
            

            for beat_id in beat_ids_to_update:

                result = await self.db.execute(
                    select(BeatPromotionModel).where(
                        and_(
                            BeatPromotionModel.beat_id == beat_id,
                            BeatPromotionModel.is_active == True
                        )
                    )
                )
                has_active_promotions = result.scalar_one_or_none() is not None
                
                if not has_active_promotions:
                    await self.db.execute(
                        update(BeatModel).where(BeatModel.id == beat_id).values(
                            promotion_status="standard"
                        )
                    )
            
            await self.db.commit()
            
            if deactivated_count > 0:
                logger.info(f"Deactivated {deactivated_count} expired promotions")
            
            return deactivated_count
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error checking expired promotions: {str(e)}")
            return 0
    
    async def get_user_promotions(self, user_id: int) -> List[BeatPromotionModel]:
        result = await self.db.execute(
            select(BeatPromotionModel).where(
                BeatPromotionModel.user_id == user_id
            ).order_by(BeatPromotionModel.created_at.desc())
        )
        return result.scalars().all()
    
    async def get_beat_promotions(self, beat_id: int) -> List[BeatPromotionModel]:
        result = await self.db.execute(
            select(BeatPromotionModel).where(
                BeatPromotionModel.beat_id == beat_id
            ).order_by(BeatPromotionModel.starts_at.desc())
        )
        return result.scalars().all()
    
    async def _get_active_promotion(self, beat_id: int) -> Optional[BeatPromotionModel]:
        result = await self.db.execute(
            select(BeatPromotionModel).where(
                and_(
                    BeatPromotionModel.beat_id == beat_id,
                    BeatPromotionModel.is_active == True,
                    BeatPromotionModel.ends_at > datetime.utcnow()
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def get_promotion_info(self) -> dict:
        return {
            "price": self.PROMOTION_PRICE,
            "duration_days": self.PROMOTION_DURATION_DAYS,
            "description": self.PROMOTION_DESCRIPTION
        }