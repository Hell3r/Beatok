from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from pathlib import Path
import logging

from src.database.database import get_session
from src.models.payment import PaymentModel, PaymentStatus
from src.models.users import UsersModel
from src.services.BalanceService import BalanceService
from src.core.config import settings

logger = logging.getLogger(__name__)
templates = Jinja2Templates(directory=Path(__file__).parent.parent.parent / "templates")
router = APIRouter(prefix="/pay", tags=["Страницы оплаты"])


@router.get("/callback")
async def tpay_callback(
    request: Request,
    session: AsyncSession = Depends(get_session)
):

    logger.info(f"сырая дата:{data}")
    try:
        data = await request.json()
    except:
        form = await request.form()
        data = dict(form)
    
    logger.info(f"📥 T-Pay callback: {data}")
    
    payment_id = data.get("PaymentId")
    status = data.get("Status")
    
    if not payment_id:
        return JSONResponse({"error": "No PaymentId"}, 400)
    
    # Ищем платеж
    from sqlalchemy import select
    result = await session.execute(
        select(PaymentModel).where(PaymentModel.tpay_payment_id == str(payment_id))
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        logger.error(f"Payment not found: {payment_id}")
        return JSONResponse({"error": "Payment not found"}, 404)
    
    # Обрабатываем статус
    if status == "CONFIRMED":
        payment.status = PaymentStatus.SUCCEEDED
        payment.paid_at = datetime.utcnow()
        
        # Начисляем баланс
        user = await session.get(UsersModel, payment.user_id)
        if user:
            balance_service = BalanceService(session)
            await balance_service.deposit(
                user_id=user.id,
                amount=payment.amount,
                description=f"Пополнение через T-Pay #{payment.tpay_payment_id}"
            )
            logger.info(f"💰 Balance +{payment.amount} for user {user.id}")
        
        await session.commit()

        html = f"""
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Оплата успешна - Beatok</title>
            <style>
                * {{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }}
                
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
                
                .success-icon {{
                    width: 96px;
                    height: 96px;
                    background: #28a745;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 32px;
                    animation: scaleIn 0.5s ease 0.2s both;
                    box-shadow: 0 10px 30px rgba(40, 167, 69, 0.3);
                }}
                
                @keyframes scaleIn {{
                    from {{
                        transform: scale(0);
                    }}
                    to {{
                        transform: scale(1);
                    }}
                }}
                
                .success-icon svg {{
                    width: 48px;
                    height: 48px;
                    fill: white;
                }}
                
                h1 {{
                    color: #333;
                    font-size: 32px;
                    margin-bottom: 16px;
                    font-weight: 700;
                }}
                
                .amount {{
                    font-size: 56px;
                    font-weight: 800;
                    color: #28a745;
                    margin: 24px 0;
                    line-height: 1;
                }}
                
                .amount span {{
                    font-size: 24px;
                    font-weight: 400;
                    color: #666;
                }}
                
                .details {{
                    background: #f8f9fa;
                    border-radius: 16px;
                    padding: 24px;
                    margin: 32px 0;
                    text-align: left;
                }}
                
                .detail-row {{
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 12px;
                    color: #666;
                    font-size: 15px;
                }}
                
                .detail-row:last-child {{
                    margin-bottom: 0;
                }}
                
                .label {{
                    font-weight: 600;
                    color: #333;
                }}
                
                .timer-container {{
                    background: #e3f2fd;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 24px 0;
                }}
                
                .timer-text {{
                    font-size: 18px;
                    font-weight: 600;
                    color: #1976d2;
                    margin-bottom: 12px;
                }}
                
                .progress-bar {{
                    width: 100%;
                    height: 8px;
                    background: #bbdefb;
                    border-radius: 4px;
                    overflow: hidden;
                }}
                
                .progress-fill {{
                    width: 100%;
                    height: 100%;
                    background: #1976d2;
                    animation: shrink 5s linear forwards;
                    transform-origin: left;
                }}
                
                @keyframes shrink {{
                    from {{
                        transform: scaleX(1);
                    }}
                    to {{
                        transform: scaleX(0);
                    }}
                }}
                
                .button {{
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-decoration: none;
                    padding: 16px 32px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 16px;
                    transition: all 0.3s;
                    margin-top: 16px;
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                }}
                
                .button:hover {{
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
                }}
                
                .info-text {{
                    color: #999;
                    font-size: 14px;
                    margin-top: 24px;
                }}
                
                @media (max-width: 480px) {{
                    .card {{
                        padding: 32px 20px;
                    }}
                    
                    h1 {{
                        font-size: 24px;
                    }}
                    
                    .amount {{
                        font-size: 42px;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="card">
                <div class="success-icon">
                    <svg viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                </div>
                
                <h1>✅ Оплата прошла успешно!</h1>
                
                <div class="amount">
                    {payment.amount:.2f} <span>₽</span>
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
                
                <div class="timer-container">
                    <div class="timer-text">
                        ⏳ Перенаправление через <span id="seconds">5</span> секунд
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                </div>
                
                <button onclick="redirectNow()" class="button">
                    Перейти сейчас →
                </button>
                
                <div class="info-text">
                    ✨ Средства уже зачислены на баланс
                </div>
            </div>
            
            <script>
                let seconds = 5;
                const timerElement = document.getElementById('seconds');
                
                function redirectNow() {{
                    window.location.href = '{settings.FRONTEND_URL}/profile?tab=balance';
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
        
    elif status in ["REJECTED", "CANCELED", "REFUNDED", "DEADLINE_EXPIRED"]:
        payment.status = PaymentStatus.FAILED
        await session.commit()
        logger.info(f"❌ Payment failed: {payment_id} - {status}")
        
        # Страница ошибки с таймером
        html = f"""
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Оплата не прошла - Beatok</title>
            <style>
                * {{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }}
                
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
                <div class="failed-icon">
                    <svg viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                    </svg>
                </div>
                
                <h1>❌ Оплата не прошла</h1>
                
                <div class="message">
                    Платёж #{payment.id} не был завершён
                </div>
                
                <div class="details">
                    <strong>Возможные причины:</strong>
                    <ul class="reasons">
                        <li>❌ Недостаточно средств на карте</li>
                        <li>🛑 Отмена платежа пользователем</li>
                        <li>🔒 Техническая ошибка</li>
                        <li>⏰ Истекло время оплаты</li>
                    </ul>
                </div>
                
                <div class="timer-container">
                    <div class="timer-text">
                        ⏳ Возврат через <span id="seconds">5</span> секунд
                    </div>
                </div>
                
                <div>
                    <button onclick="redirectRetry()" class="button">
                        Попробовать снова
                    </button>
                    <button onclick="redirectHome()" class="button secondary">
                        На главную
                    </button>
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


@router.get("/success")
async def payment_success_redirect(
    payment_id: int,
    session: AsyncSession = Depends(get_session)
):
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/payment/success?payment_id={payment_id}")


@router.get("/failed")
async def payment_failed_redirect(
    payment_id: int,
    session: AsyncSession = Depends(get_session)
):
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/payment/failed?payment_id={payment_id}")