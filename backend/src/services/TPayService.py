# src/services/TPayService.py
import logging
import uuid
import httpx
import hashlib
from decimal import Decimal
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, Optional, List

from src.core.config import settings
from src.models.payment import PaymentModel, PaymentStatus
from src.models.users import UsersModel
from src.services.BalanceService import BalanceService

logger = logging.getLogger(__name__)


class TPayService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.balance_service = BalanceService(db)
        
        # Настройки из .env
        self.terminal_key = settings.TPAY_TERMINAL_KEY
        self.password = settings.TPAY_PASSWORD
        self.api_url = "https://securepay.tinkoff.ru/v2"
        
        # URL для редиректов - ведут на наши страницы
        self.callback_url = f"https://c99ce6198e6b7e.lhr.life/pay/callback"
        
        logger.info(f"✅ T-Pay service initialized. Terminal: {self.terminal_key[:8]}...")
        logger.info(f"   Success URL: {self.callback_url}")
    
    
    async def create_payment(
        self, 
        user_id: int, 
        amount: Decimal, 
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        
        try:
            # Валидация
            if amount < Decimal('10.00'):
                raise ValueError("Минимальная сумма пополнения 10 ₽")
            if amount > Decimal('100000.00'):
                raise ValueError("Максимальная сумма пополнения 100 000 ₽")
            
            # Уникальный ID заказа
            order_id = f"BEATOK_{user_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"
            
            # Данные для T-Pay API
            payload = {
                "TerminalKey": self.terminal_key,
                "Amount": int(amount * 100),  # В копейках!
                "OrderId": order_id,
                "Description": description or f"Пополнение баланса Beatok",
                "SuccessURL": self.callback_url
            }
            
            # Генерируем токен (обязательно!)
            payload["Token"] = self._generate_token(payload)
            
            logger.info(f"📤 Sending request to T-Pay: OrderId={order_id}, Amount={amount}")
            logger.debug(f"Payload: {payload}")
            
            # Отправляем запрос
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/Init",
                    json=payload,
                    timeout=30
                )
                response.raise_for_status()
                result = response.json()
            
            logger.info(f"📥 T-Pay response: {result}")
            
            if not result.get("Success"):
                error_msg = result.get("Message", "Неизвестная ошибка")
                error_details = result.get("Details", "")
                logger.error(f"❌ T-Pay Init failed: {error_msg} {error_details}")
                raise ValueError(f"Ошибка T-Pay: {error_msg}")
            
            # Сохраняем платеж в БД
            payment = PaymentModel(
                user_id=user_id,
                amount=amount,
                tpay_payment_id=str(result["PaymentId"]),
                tpay_payment_url=result.get("PaymentURL"),
                status=PaymentStatus.PENDING,
                description=description
            )
            
            self.db.add(payment)
            await self.db.commit()
            await self.db.refresh(payment)
            
            logger.info(f"💰 T-Pay payment created: {payment.tpay_payment_id} for user {user_id}")
            logger.info(f"🔗 Payment URL: {payment.tpay_payment_url}")
            
            return {
                "id": payment.id,
                "amount": float(amount),
                "payment_url": payment.tpay_payment_url,
                "payment_id": payment.tpay_payment_id,
                "status": "pending"
            }
            
        except httpx.HTTPStatusError as e:
            await self.db.rollback()
            logger.error(f"❌ T-Pay HTTP error: {e.response.status_code} - {e.response.text}")
            raise ValueError(f"Ошибка подключения к T-Pay: {str(e)}")
            
        except httpx.TimeoutException:
            await self.db.rollback()
            logger.error("❌ T-Pay timeout")
            raise ValueError("Таймаут при подключении к T-Pay")
            
        except ValueError as e:
            await self.db.rollback()
            logger.error(f"❌ Validation error: {e}")
            raise
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"❌ T-Pay create error: {e}", exc_info=True)
            raise ValueError(f"Ошибка создания платежа: {str(e)}")
    
    # ========== 2. ПОЛУЧЕНИЕ СТАТУСА ИЗ БД ==========
    
    async def get_payment_status(
        self, 
        payment_id: int, 
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Получить статус платежа ИЗ БАЗЫ ДАННЫХ
        
        НИКАКИХ ЗАПРОСОВ К T-Pay API!
        Статус обновляется при редиректе на страницу успеха.
        
        Args:
            payment_id: ID платежа в нашей БД
            user_id: ID пользователя (для проверки принадлежности)
            
        Returns:
            Dict со статусом, суммой, датами
        """
        # Ищем платеж
        query = select(PaymentModel).where(PaymentModel.id == payment_id)
        
        if user_id:
            query = query.where(PaymentModel.user_id == user_id)
        
        result = await self.db.execute(query)
        payment = result.scalar_one_or_none()
        
        if not payment:
            raise ValueError("Платеж не найден")
        
        # Возвращаем статус из БД
        return {
            "id": payment.id,
            "amount": float(payment.amount),
            "status": payment.status.value,
            "created_at": payment.created_at,
            "paid_at": payment.paid_at,
            "tpay_payment_id": payment.tpay_payment_id
        }
    
    # ========== 3. ИСТОРИЯ ПЛАТЕЖЕЙ ==========
    
    async def get_user_payments(
        self, 
        user_id: int,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Получить историю платежей пользователя
        
        Args:
            user_id: ID пользователя
            limit: Количество записей
            offset: Смещение
            
        Returns:
            List[Dict] с платежами
        """
        result = await self.db.execute(
            select(PaymentModel)
            .where(PaymentModel.user_id == user_id)
            .order_by(PaymentModel.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        
        payments = result.scalars().all()
        
        return [
            {
                "id": p.id,
                "amount": float(p.amount),
                "status": p.status.value,
                "description": p.description,
                "created_at": p.created_at.isoformat(),
                "paid_at": p.paid_at.isoformat() if p.paid_at else None,
                "tpay_payment_id": p.tpay_payment_id
            }
            for p in payments
        ]
    
    # ========== 4. ГЕНЕРАЦИЯ ТОКЕНА ==========
    
    def _generate_token(self, params: Dict[str, Any]) -> str:
        """
        Генерация токена для T-Pay по спецификации:
        
        1. Берем ТОЛЬКО корневые параметры (без вложенных объектов)
        2. Добавляем Password из настроек
        3. Сортируем ключи по алфавиту
        4. Конкатенируем ТОЛЬКО значения (без ключей!)
        5. SHA-256 хеш
        
        Args:
            params: Параметры запроса
            
        Returns:
            Токен для T-Pay API
        """
        # Только корневые параметры (исключаем Token, вложенные объекты, None)
        root_params = {}
        for key, value in params.items():
            if (key != "Token" and 
                value is not None and 
                not isinstance(value, (dict, list, set))):
                root_params[key] = str(value)
        
        # Добавляем пароль
        root_params["Password"] = self.password
        
        # Сортируем по ключу (алфавитный порядок)
        sorted_keys = sorted(root_params.keys())
        
        # Конкатенируем ТОЛЬКО значения
        values_string = ""
        for key in sorted_keys:
            values_string += root_params[key]
        
        # SHA-256 хеш
        token = hashlib.sha256(values_string.encode('utf-8')).hexdigest()
        
        # Логируем в debug режиме
        if settings.DEBUG:
            logger.debug(f"Token generation:")
            logger.debug(f"  Params: {root_params}")
            logger.debug(f"  Sorted keys: {sorted_keys}")
            logger.debug(f"  Values string: {values_string}")
            logger.debug(f"  Token: {token}")
        
        return token
    
    # ========== 5. ПРОВЕРКА ПОДПИСИ ВЕБХУКА (ЗАПАСНОЙ ВАРИАНТ) ==========
    
    def _verify_webhook_signature(self, webhook_data: Dict[str, Any]) -> bool:
        """
        Проверка подписи вебхука от T-Pay
        
        T-Банк отправляет Token в теле вебхука.
        Нужно удалить Token, сгенерировать заново и сравнить.
        
        Args:
            webhook_data: Данные вебхука
            
        Returns:
            True если подпись валидна
        """
        received_token = webhook_data.pop("Token", None)
        
        if not received_token:
            logger.warning("No Token in webhook")
            return False
        
        # Генерируем токен из данных вебхука
        calculated_token = self._generate_token(webhook_data)
        
        # Восстанавливаем Token обратно
        webhook_data["Token"] = received_token
        
        # Сравниваем
        is_valid = calculated_token == received_token
        
        if not is_valid:
            logger.warning(f"Invalid webhook signature: {received_token} != {calculated_token}")
        
        return is_valid
    
    # ========== 6. ОБРАБОТКА ВЕБХУКА (ЗАПАСНОЙ ВАРИАНТ) ==========
    
    async def handle_webhook(self, webhook_data: Dict[str, Any]) -> bool:
        """
        Обработка вебхука от T-Pay
        
        В текущей реализации НЕ ИСПОЛЬЗУЕТСЯ,
        так как мы полагаемся на редирект пользователя.
        
        Оставлено для совместимости и возможного использования в будущем.
        
        Args:
            webhook_data: Данные вебхука
            
        Returns:
            True если обработка успешна
        """
        try:
            logger.info(f"📥 T-Pay webhook received: {webhook_data.get('PaymentId')}")
            
            # Проверяем подпись
            if not self._verify_webhook_signature(webhook_data):
                logger.error("Invalid webhook signature")
                return False
            
            payment_id = webhook_data.get("PaymentId")
            status = webhook_data.get("Status")
            
            if not payment_id or not status:
                logger.error("Missing PaymentId or Status in webhook")
                return False
            
            # Ищем платеж в БД
            result = await self.db.execute(
                select(PaymentModel).where(
                    PaymentModel.tpay_payment_id == str(payment_id)
                )
            )
            payment = result.scalar_one_or_none()
            
            if not payment:
                logger.error(f"Payment not found: {payment_id}")
                return False
            
            # Обновляем статус
            old_status = payment.status.value
            
            if status == "CONFIRMED":
                payment.status = PaymentStatus.SUCCEEDED
                payment.paid_at = datetime.utcnow()
                
                # Пополняем баланс
                user = await self.db.get(UsersModel, payment.user_id)
                if user:
                    await self.balance_service.deposit(
                        user_id=user.id,
                        amount=payment.amount,
                        description=f"Пополнение через T-Pay #{payment.tpay_payment_id}"
                    )
                
                logger.info(f"✅ Payment confirmed via webhook: {payment_id}")
                
            elif status in ["REJECTED", "CANCELED", "REFUNDED"]:
                payment.status = PaymentStatus.FAILED
                logger.info(f"❌ Payment failed via webhook: {payment_id} - {status}")
                
            elif status == "DEADLINE_EXPIRED":
                payment.status = PaymentStatus.EXPIRED
                logger.info(f"⏰ Payment expired via webhook: {payment_id}")
            
            await self.db.commit()
            
            logger.info(f"  Payment {payment_id}: {old_status} -> {payment.status.value}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Webhook processing error: {e}", exc_info=True)
            return False