from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from pathlib import Path
import logging
from decimal import Decimal
from src.database.database import get_session
from src.models.payment import PaymentModel, PaymentStatus
from src.models.users import UsersModel
from src.services.BalanceService import BalanceService
from src.core.config import settings

logger = logging.getLogger(__name__)
templates = Jinja2Templates(directory=Path(__file__).parent.parent.parent / "templates")
router = APIRouter(prefix="/pay", tags=["Страницы оплаты"])


@router.api_route("/callback", methods=["GET", "POST"], summary = "Страница оплаты (успешно / неуспешно)")
async def tpay_callback(
    request: Request,
    session: AsyncSession = Depends(get_session)
):

    data = {}
    

    from sqlalchemy import select
    from src.services.TPayService import TPayService
    
    result = await session.execute(
        select(PaymentModel)
        .where(PaymentModel.status == PaymentStatus.PENDING)
        .order_by(PaymentModel.created_at.desc())
        .limit(1)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        logger.error("❌ No pending payments found")
        return JSONResponse({"error": "No pending payment found"}, 404)
    
    logger.info(f"📥 Found pending payment: {payment.tpay_payment_id}")
    
    tpay_service = TPayService(session)
    try:
        result = await tpay_service.check_and_update_payment(payment.tpay_payment_id)
        logger.info(f"✅ Payment check result: {result}")
        payment = await session.get(PaymentModel, payment.id)
    except Exception as e:
        logger.error(f"❌ Error checking payment: {e}")
    
    payment_id = payment.tpay_payment_id
    status = payment.status.value

    if status == "succeeded":

        html = f"""
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Оплата успешна - БИТОК</title>
            <style>
                * {{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    user-select: none;
                }}
                
                body {{
                    background-color: #0a0a0a;
                    font-family: Arial, sans-serif;
                    color: white;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }}
                
                .card {{
                    width: 100%;
                    max-width: 520px;
                    padding: 48px;
                    text-align: center;
                }}
                
                .icon {{
                    width: 80px;
                    height: 80px;
                    background-color: #dc2626;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px auto;
                }}
                
                .icon svg {{
                    width: 40px;
                    height: 40px;
                    color: white;
                }}
                
                .icon.success {{
                    background-color: #22c55e;
                }}
                
                .icon.failed {{
                    background-color: #dc2626;
                }}
                
                h1 {{
                    color: white;
                    font-weight: bold;
                    font-size: 1.875rem;
                    margin-bottom: 16px;
                }}
                
                .amount {{
                    font-size: 3rem;
                    font-weight: bold;
                    color: #22c55e;
                    margin: 24px 0;
                }}
                
                .amount span {{
                    font-size: 1.5rem;
                    color: #888;
                }}
                
                .details {{
                    background-color: #171717;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 24px 0;
                    text-align: left;
                }}
                
                .detail-row {{
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    color: #a3a3a3;
                    font-size: 0.875rem;
                }}
                
                .detail-row:last-child {{
                    margin-bottom: 0;
                }}
                
                .label {{
                    color: #737373;
                }}
                
                .timer-text {{
                    color: #a3a3a3;
                    font-size: 0.875rem;
                    margin-top: 24px;
                }}
                
                .button {{
                    background-color: #dc2626;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-weight: 500;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                    margin: 8px;
                }}
                
                .button:hover {{
                    background-color: #b91c1c;
                }}
                
                .button.secondary {{
                    background-color: #262626;
                }}
                
                .button.secondary:hover {{
                    background-color: #404040;
                }}
                
                .reasons {{
                    color: #a3a3a3;
                    text-align: left;
                    margin-top: 12px;
                    padding-left: 20px;
                    line-height: 1.8;
                }}
            </style>
        </head>
        <body>
            <div class="card">
                <div class="icon success">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                    </svg>
                </div>
                
                <h1>Оплата прошла успешно!</h1>
                
                <div class="amount">
                    {round(payment.amount * Decimal(0.95), 2)} <span>₽</span>
                </div>
                
                <div class="details">
                    <div class="detail-row">
                        <span class="label">ID платежа:</span>
                        <span>#{payment.id}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Дата:</span>
                        <span>{payment.paid_at.strftime('%d.%m.%Y %H:%M') if payment.paid_at else datetime.utcnow().strftime('%d.%m.%Y %H:%M')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Способ оплаты:</span>
                        <span>T-Pay (Т-Банк)</span>
                    </div>
                </div>
                
                <button onclick="redirectNow()" class="button">
                    Перейти в профиль
                </button>
                
                <div class="timer-text">
                    Перенаправление через <span id="seconds">5</span> секунд
                </div>
            </div>
            
            <script>
                let seconds = 5;
                const timerElement = document.getElementById('seconds');
                
                function redirectNow() {{
                    window.location.href = 'http://185.55.59.6:5173';
                }}
                
                function updateTimer() {{
                    seconds--;
                    if (timerElement) {{
                        timerElement.textContent = seconds;
                    }}
                    
                    if (seconds <= 0) {{
                        redirectNow();
                    }}
                }}
                
                setInterval(updateTimer, 1000);
                setTimeout(redirectNow, 5000);
            </script>
        </body>
        </html>
        """
        return HTMLResponse(content=html)
        
    elif status in ["failed", "expired", "pending"]:
        logger.info(f"❌ Payment failed: {payment_id}")

        html = f"""
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Оплата не прошла - БИТОК</title>
            <style>
                * {{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }}
                
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background-color: #0a0a0a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: 20px;
                }}
                
                .card {{
                    background: white;
                    border-radius: 24px;
                    padding: 48px;
                    max-width: 520px;
                    width: 100%;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    text-align: center;
                    animation: slideIn 0.5s ease;
                }}
                
                @keyframes slideIn {{
                    from {{
                        opacity: 0;
                        transform: translateY(30px);
                    }}
                    to {{
                        opacity: 1;
                        transform: translateY(0);
                    }}
                }}
                
                .failed-icon {{
                    width: 96px;
                    height: 96px;
                    background: #dc3545;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 32px;
                    animation: scaleIn 0.5s ease 0.2s both;
                    box-shadow: 0 10px 30px rgba(220, 53, 69, 0.3);
                }}
                
                @keyframes scaleIn {{
                    from {{
                        transform: scale(0);
                    }}
                    to {{
                        transform: scale(1);
                    }}
                }}
                
                .failed-icon svg {{
                    width: 48px;
                    height: 48px;
                    fill: white;
                }}
                
                h1 {{
                    color: #333;
                    font-size: 28px;
                    margin-bottom: 16px;
                    font-weight: 700;
                }}
                
                .message {{
                    font-size: 16px;
                    color: #666;
                    margin: 24px 0;
                    line-height: 1.6;
                }}
                
                .details {{
                    background: #f8f9fa;
                    border-radius: 16px;
                    padding: 24px;
                    margin: 32px 0;
                    text-align: left;
                }}
                
                .reasons {{
                    color: #666;
                    line-height: 1.8;
                    margin-top: 12px;
                    padding-left: 20px;
                }}
                
                .timer-container {{
                    background: #fff3e0;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 24px 0;
                }}
                
                .timer-text {{
                    font-size: 16px;
                    font-weight: 600;
                    color: #e65100;
                    margin-bottom: 12px;
                }}
                
                .button {{
                    display: inline-block;
                    background-color: #0a0a0a;
                    color: white;
                    text-decoration: none;
                    padding: 16px 32px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 16px;
                    transition: all 0.3s;
                    margin: 8px;
                    border: none;
                    cursor: pointer;
                }}
                
                .button.secondary {{
                    background: #6c757d;
                }}
                
                .button:hover {{
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
                }}
            </style>
        </head>
        <body>
            <div class="card">
                <div class="icon failed">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </div>
                
                <h1>Оплата не прошла</h1>
                
                <div class="details">
                    <strong style="color: #a3a3a3;">Возможные причины:</strong>
                    <ul class="reasons">
                        <li>Недостаточно средств на карте</li>
                        <li>Отмена платежа пользователем</li>
                        <li>Техническая ошибка</li>
                        <li>Истекло время оплаты</li>
                    </ul>
                </div>
                
                <button onclick="redirectRetry()" class="button">
                    Попробовать снова
                </button>
                
                <button onclick="redirectHome()" class="button secondary">
                    На главную
                </button>
                
                <div class="timer-text">
                    Перенаправление через <span id="seconds">5</span> секунд
                </div>
            </div>
            
            <script>
                let seconds = 5;
                const timerElement = document.getElementById('seconds');
                
                function redirectRetry() {{
                    window.location.href = '{settings.FRONTEND_URL}/balance';
                }}
                
                function redirectHome() {{
                    window.location.href = '{settings.FRONTEND_URL}';
                }}
                
                function updateTimer() {{
                    seconds--;
                    if (timerElement) {{
                        timerElement.textContent = seconds;
                    }}
                    
                    if (seconds <= 0) {{
                        redirectRetry();
                    }}
                }}
                
                setInterval(updateTimer, 1000);
                setTimeout(redirectRetry, 5000);
            </script>
        </body>
        </html>
        """
        return HTMLResponse(content=html)
    
    return JSONResponse({"status": "OK"})