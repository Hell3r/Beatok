import logging
import uuid
import os
from yookassa import Payment, Payout
from yookassa.domain.notification import WebhookNotification
from yookassa.domain.common import SecurityHelper
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.models.payment import PaymentModel, PaymentStatus
from src.models.users import UsersModel
from src.models.balance import UserBalanceModel, BalanceOperationType
from src.services.BalanceService import BalanceService
from src.services.PromoService import PromoCodeService
from typing import Optional

logger = logging.getLogger(__name__)

class RealYookassaService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_payment(self, user_id: int, amount: Decimal, description: str = None) -> dict:
        try:
            payment = Payment.create({
                "amount": {
                    "value": f"{amount:.2f}",
                    "currency": "RUB"
                },
                "payment_method_data": {
                    "type": "bank_card"
                },
                "confirmation": {
                    "type": "redirect",
                    "return_url": "https://your-site.com/payment/success"
                },
                "description": description or f"Пополнение баланса пользователя {user_id}",
                "metadata": {
                    "user_id": str(user_id)
                },
                "capture": True,
                "save_payment_method": False,
                "test": True
            })
            
            db_payment = PaymentModel(
                user_id=user_id,
                amount=amount,
                external_payment_id=payment.id,
                description=description,
                status=PaymentStatus.PENDING,
                payment_url=payment.confirmation.confirmation_url,
                expired_at=datetime.utcnow() + timedelta(days=1)
            )
            
            self.db.add(db_payment)
            await self.db.commit()
            await self.db.refresh(db_payment)
            
            logger.info(f"YOOKASSA_PAYMENT_CREATED: {payment.id} for user {user_id}")
            
            return {
                "id": db_payment.id,
                "amount": float(amount),
                "status": payment.status,
                "payment_url": payment.confirmation.confirmation_url,
                "external_payment_id": payment.id
            }
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"YOOKASSA_PAYMENT_ERROR: {str(e)}")
            raise ValueError(f"Ошибка создания платежа: {str(e)}")
    
    async def create_payout(
        self, 
        amount: float, 
        payout_destination: dict,
        description: str = None
    ) -> dict:
        try:
            idempotence_key = str(uuid.uuid4())
            
            payout_request = {
                "amount": {
                    "value": f"{amount:.2f}",
                    "currency": "RUB"
                },
                "payout_destination": {
                    "type": "bank_card",
                    "card": {
                        "number": payout_destination['card_number']
                    }
                },
                "description": description or "Вывод средств",
                "metadata": {
                    "payout_type": "withdrawal"
                },
                "test": True
            }

            logger.info(f"Creating payout with request: {payout_request}")
            
            payout = Payout.create(payout_request, idempotence_key)
            
            logger.info(f"YOOKASSA_PAYOUT_CREATED: {payout.id} for card {payout_destination['card_number'][-4:]}")
            
            return {
                "id": payout.id,
                "status": payout.status,
                "amount": float(payout.amount.value),
                "description": payout.description,
                "created_at": payout.created_at
            }
            
        except Exception as e:
            logger.error(f"YOOKASSA_PAYOUT_ERROR: {str(e)}")
            raise Exception(f"Ошибка создания выплаты через Payout API: {str(e)}")

    async def create_withdrawal_payment(
        self, 
        amount: float, 
        card_number: str,
        description: str = None
    ) -> dict:
        try:
            idempotence_key = str(uuid.uuid4())
            
            cleaned_card_number = str(card_number).replace(' ', '')
            
            payment_request = {
                "amount": {
                    "value": f"{amount:.2f}",
                    "currency": "RUB"
                },
                "payment_method_data": {
                    "type": "bank_card",
                    "card": {
                        "number": cleaned_card_number,
                        "expiry_year": "2030",
                        "expiry_month": "12",   
                    }
                },
                "confirmation": {
                    "type": "redirect",
                    "return_url": "https://your-site.com/withdrawal/success"
                },
                "capture": True,
                "description": description or "Вывод средств",
                "metadata": {
                    "withdrawal": "true",
                    "card_last_4": cleaned_card_number[-4:]
                },
                "test": True
            }

            logger.info(f"Creating withdrawal payment for card: {cleaned_card_number[-4:]}")
            
            payment = Payment.create(payment_request, idempotence_key)
            
            logger.info(f"YOOKASSA_WITHDRAWAL_PAYMENT_CREATED: {payment.id}")
            
            return {
                "id": payment.id,
                "status": payment.status,
                "amount": float(payment.amount.value),
                "confirmation_url": getattr(payment.confirmation, 'confirmation_url', None),
                "created_at": payment.created_at
            }
            
        except Exception as e:
            logger.error(f"YOOKASSA_WITHDRAWAL_PAYMENT_ERROR: {str(e)}")
            raise Exception(f"Ошибка создания выплаты через Payment API: {str(e)}")

    async def create_simple_withdrawal(
        self,
        amount: float,
        card_number: str,
        description: str = None
    ) -> dict:
        try:
            idempotence_key = str(uuid.uuid4())

            cleaned_card_number = str(card_number).replace(' ', '')

            # Используем Payout API вместо Payment API
            payout_request = {
                "amount": {
                    "value": f"{amount:.2f}",
                    "currency": "RUB"
                },
                "payout_destination_data": {
                    "type": "bank_card",
                    "card": {
                        "number": cleaned_card_number
                    }
                },
                "description": description or f"Вывод средств на карту {cleaned_card_number[-4:]}",
                "metadata": {
                    "withdrawal_id": "auto",
                    "card_last_4": cleaned_card_number[-4:]
                },
                "test": True
            }

            logger.info(f"Creating payout for card: {cleaned_card_number[-4:]}")

            payout = Payout.create(payout_request, idempotence_key)

            logger.info(f"PAYOUT_CREATED: {payout.id}, status: {payout.status}")

            return {
                "id": payout.id,
                "status": payout.status,
                "amount": float(payout.amount.value),
                "description": payout.description,
                "created_at": payout.created_at
            }

        except Exception as e:
            logger.error(f"PAYOUT_CREATION_ERROR: {str(e)}")
            raise Exception(f"Ошибка создания выплаты: {str(e)}")

    async def handle_webhook(self, webhook_data: dict) -> bool:
        try:
            notification = WebhookNotification(webhook_data)
            payment = notification.object
            
            logger.info(f"YOOKASSA_WEBHOOK: {payment.id} status: {payment.status}")
            
            if payment.status == 'succeeded':
                return await self._handle_successful_payment(payment)
            elif payment.status == 'canceled':
                return await self._handle_canceled_payment(payment)
            elif payment.status == 'waiting_for_capture':
                return await self._handle_waiting_for_capture(payment)
            
            return True
            
        except Exception as e:
            logger.error(f"WEBHOOK_PROCESSING_ERROR: {str(e)}")
            return False
    
    async def _handle_successful_payment(self, payment) -> bool:
        try:
            db_payment = await self.db.execute(
                select(PaymentModel).where(PaymentModel.external_payment_id == payment.id)
            )
            db_payment = db_payment.scalar_one_or_none()

            if not db_payment:
                logger.error(f"PAYMENT_NOT_FOUND: {payment.id}")
                return False

            if db_payment.status == PaymentStatus.SUCCEEDED:
                logger.info(f"PAYMENT_ALREADY_PROCESSED: {payment.id}")
                return True

            db_payment.status = PaymentStatus.SUCCEEDED
            db_payment.paid_at = datetime.utcnow()
            db_payment.payment_method = getattr(payment.payment_method, 'type', 'unknown')

            user = await self.db.get(UsersModel, db_payment.user_id)
            if not user:
                logger.error(f"USER_NOT_FOUND: {db_payment.user_id}")
                return False

            balance_service = BalanceService(self.db)
            new_balance = await balance_service.deposit(
                user_id=user.id,
                amount=Decimal(str(payment.amount.value)),
                description=f"Пополнение через ЮКассу (платеж {payment.id})"
            )

            try:
                promo_service = PromoCodeService(self.db)
                await promo_service.apply_promo_for_deposit(user.id, float(Decimal(str(payment.amount.value))))
            except Exception as promo_error:
                logger.warning(f"PROMO_APPLICATION_ERROR: {promo_error} - продолжаем без промокода")

            await self.db.commit()
            logger.info(f"✅ BALANCE_UPDATED: User {user.id} +{payment.amount.value} RUB. New balance: {new_balance}")

            return True

        except Exception as e:
            await self.db.rollback()
            logger.error(f"PAYMENT_PROCESSING_ERROR: {str(e)}")
            return False
    
    async def _handle_canceled_payment(self, payment) -> bool:
        db_payment = await self.db.execute(
            select(PaymentModel).where(PaymentModel.external_payment_id == payment.id)
        )
        db_payment = db_payment.scalar_one_or_none()
        
        if db_payment:
            db_payment.status = PaymentStatus.CANCELED
            await self.db.commit()
            logger.info(f"PAYMENT_CANCELED: {payment.id}")
        
        return True
    
    async def _handle_waiting_for_capture(self, payment) -> bool:
        db_payment = await self.db.execute(
            select(PaymentModel).where(PaymentModel.external_payment_id == payment.id)
        )
        db_payment = db_payment.scalar_one_or_none()
        
        if db_payment:
            db_payment.status = PaymentStatus.WAITING_FOR_CAPTURE
            await self.db.commit()
            logger.info(f"PAYMENT_WAITING_FOR_CAPTURE: {payment.id}")
        
        return True
    
    async def get_payment_status(self, payment_id: int) -> Optional[dict]:
        db_payment = await self.db.get(PaymentModel, payment_id)
        
        if not db_payment:
            return None

        try:
            yookassa_payment = Payment.find_one(db_payment.external_payment_id)
            return {
                "id": db_payment.id,
                "status": yookassa_payment.status,
                "amount": float(db_payment.amount),
                "payment_url": db_payment.payment_url,
                "external_payment_id": db_payment.external_payment_id,
                "created_at": db_payment.created_at,
                "paid_at": db_payment.paid_at
            }
        except Exception:
            return {
                "id": db_payment.id,
                "status": db_payment.status.value,
                "amount": float(db_payment.amount),
                "payment_url": db_payment.payment_url,
                "external_payment_id": db_payment.external_payment_id,
                "created_at": db_payment.created_at,
                "paid_at": db_payment.paid_at
            }

    async def get_payout_status(self, payout_id: str) -> dict:
        try:
            payout = Payout.find_one(payout_id)
            return {
                "id": payout.id,
                "status": payout.status,
                "amount": float(payout.amount.value),
                "description": payout.description,
                "created_at": payout.created_at
            }
        except Exception as e:
            logger.error(f"YOOKASSA_PAYOUT_STATUS_ERROR: {str(e)}")
            raise Exception(f"Ошибка получения статуса выплаты: {str(e)}")

    def validate_webhook_signature(self, webhook_body: dict, signature: str) -> bool:
        try:
            return SecurityHelper().is_valid_signature(webhook_body, signature)
        except Exception as e:
            logger.error(f"WEBHOOK_SIGNATURE_VALIDATION_ERROR: {str(e)}")
            return False