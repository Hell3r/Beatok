from fastapi import APIRouter, HTTPException, status, Depends, Response, Request, BackgroundTasks
from sqlalchemy import text
from sqlalchemy.orm import Session
from src.database.database import engine, get_session, Base
from yookassa import Payment, Configuration
from yookassa.domain.exceptions import BadRequestError, ResponseProcessingError
from src.models.users import UsersModel
from src.models.beat_bricing import BeatPricingModel
from src.models.beats import BeatModel
from src.models.tarrifs import TariffTemplateModel
from src.models.email_verification import EmailVerificationModel
from src.models.promo import PromoCodeModel, UserPromoCodeModel
from src.dependencies.auth import get_current_user
from src.models.requests import RequestsModel
from src.models.withdrawal import WithdrawalModel
from src.models.payment import PaymentModel
from src.models.balance import UserBalanceModel
from src.services.EmailService import email_service
from src.dependencies.services import PaymentFacadeServiceDep
from src.services.PaymentFacade import PaymentFacadeService
import json
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix = "/v1/payments", tags = ["Интеграция с Юкассой"])




@router.get("/connection", summary= "Проверка подключения к Юкассе")
async def test_yookassa_connection():
    try:
        payment_list = Payment.list({"limit": 1})
        
        return {
            "status": "success",
            "message": "✅ Подключение к ЮКассе работает!",
            "details": {
                "api_available": True,
                "test_mode": Configuration.secret_key.startswith('test_'),
                "account_id": Configuration.account_id,
                "payments_count": getattr(payment_list, 'items', [])
            }
        }
        
    except BadRequestError as e:
        logger.error(f"ЮКасса BadRequestError: {e}")
        return {
            "status": "error",
            "message": "❌ Ошибка запроса к ЮКассе",
            "error": str(e),
            "details": {
                "account_id": Configuration.account_id,
                "test_mode": Configuration.secret_key.startswith('test_')
            }
        }, 400
        
    except ResponseProcessingError as e:
        logger.error(f"ЮКасса ResponseProcessingError: {e}")
        return {
            "status": "error", 
            "message": "❌ Ошибка обработки ответа от ЮКассы",
            "error": str(e)
        }, 500
        
    except Exception as e:
        logger.error(f"ЮКасса Unknown Error: {e}")
        return {
            "status": "error",
            "message": "❌ Неизвестная ошибка подключения к ЮКассе",
            "error": str(e)
        }, 500

@router.post("/create-test-payment", summary= "Создание тестового платежа в Юкассе")
async def create_test_payment(
    payment_service: PaymentFacadeServiceDep,
    amount: float = 100.00,
    current_user: UsersModel = Depends(get_current_user),
):
    try:
        result = await payment_service.create_payment(
            user_id=current_user.id,
            amount=Decimal(str(amount)),
            description=f"Тестовый платеж от пользователя {current_user.id}"
        )
        
        return {
            "status": "success",
            "message": "✅ Тестовый платеж создан!",
            "payment_data": result,
            "instructions": {
                "next_step": "Перейдите по payment_url для оплаты"
            }
        }
        
    except Exception as e:
        logger.error(f"Test payment creation error: {e}")
        raise HTTPException(400, f"Ошибка создания тестового платежа: {str(e)}")

@router.get("/payment-status/{payment_id}", summary= "Получить статус платежа")
async def get_test_payment_status(
    payment_id: int,
    payment_service: PaymentFacadeServiceDep
):
    try:
        status_result = await payment_service.get_payment_status(payment_id)
        
        if status_result:
            return {
                "status": "success",
                "payment_info": status_result
            }
        
        try:
            yookassa_payment = Payment.find_one(payment_id)
            return {
                "status": "success", 
                "payment_info": {
                    "id": yookassa_payment.id,
                    "status": yookassa_payment.status,
                    "amount": {
                        "value": getattr(yookassa_payment.amount, 'value', '0'),
                        "currency": getattr(yookassa_payment.amount, 'currency', 'RUB')
                    },
                    "paid": yookassa_payment.paid,
                    "created_at": yookassa_payment.created_at
                },
                "source": "yookassa_api"
            }
        except Exception as api_error:
            return {
                "status": "error",
                "message": f"Платеж не найден ни в базе, ни в ЮКассе",
                "error": str(api_error)
            }, 404
            
    except Exception as e:
        logger.error(f"Payment status check error: {e}")
        raise HTTPException(400, f"Ошибка проверки статуса: {str(e)}")
    

@router.get("/config", summary= "Получить конфиг Юкассы")
async def get_yookassa_config():
    return {
        "status": "success",
        "config": {
            "account_id": Configuration.account_id,
            "secret_key": f"{Configuration.secret_key[:10]}...", 
            "test_mode": Configuration.secret_key.startswith('test_'),
            "api_url": "https://api.yookassa.ru/v3" if not Configuration.secret_key.startswith('test_') else "https://api.yookassa.ru/v3 (test)"
        },
        "environment": {
            "yookassa_shop_id_set": bool(Configuration.account_id),
            "yookassa_secret_set": bool(Configuration.secret_key),
            "test_mode_detected": Configuration.secret_key.startswith('test_')
        }
    }
    
        
@router.post("/webhook", summary= "Ручка для вебхуков")
async def yookassa_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    payment_service: PaymentFacadeServiceDep
):
    try:
        logger.info("🎯 WEBHOOK RECEIVED - Headers and body check")
        
        headers = dict(request.headers)
        logger.info(f"📋 Headers: {headers}")
        
        body = await request.body()
        body_str = body.decode('utf-8')
        logger.info(f"📦 Body: {body_str}")
        
        webhook_data = json.loads(body_str)
        logger.info(f"🔔 Webhook event: {webhook_data.get('event', 'unknown')}")

        background_tasks.add_task(
            payment_service.handle_webhook,
            webhook_data
        )
        
        logger.info("✅ Webhook accepted and processing started")
        return {"status": "success", "message": "Webhook accepted"}
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ JSON decode error: {e}")
        return {"status": "error", "message": "Invalid JSON"}, 400
    except Exception as e:
        logger.error(f"❌ Webhook error: {str(e)}")
        return {"status": "error", "message": "Internal error"}, 500
    
    
    
    
@router.post("/deposit", summary= "Платеж для пополнения баланса")
async def deposit_balance(
    payment_service: PaymentFacadeServiceDep,
    amount: float,
    current_user: UsersModel = Depends(get_current_user)
):
    try:
        if amount <= 0:
            raise HTTPException(400, "Сумма пополнения должна быть положительной")
        

        result = await payment_service.create_payment(
            user_id=current_user.id,
            amount=Decimal(str(amount)),
            description=f"Пополнение баланса пользователя {current_user.email}"
        )
        
        return {
            "status": "success",
            "message": "Платеж создан",
            "payment_data": {
                "id": result["id"],
                "amount": amount,
                "payment_url": result["payment_url"],
                "status": result["status"]
            },
            "instructions": "Перейдите по payment_url для оплаты"
        }
        
    except Exception as e:
        logger.error(f"DEPOSIT_PAYMENT_ERROR: {str(e)}")
        raise HTTPException(400, f"Ошибка создания платежа: {str(e)}")