from fastapi import APIRouter, HTTPException, status, Depends, Response
from sqlalchemy import text
from sqlalchemy.orm import Session
from src.database.database import engine, get_session, Base
from src.models.users import UsersModel
from src.models.beat_bricing import BeatPricingModel
from src.models.beats import BeatModel
from src.models.tarrifs import TariffTemplateModel
from src.models.email_verification import EmailVerificationModel
from src.models.promo import PromoCodeModel, PromoCodeUsageModel
from src.models.purchase import PurchaseModel, PurchaseItemModel
from src.models.requests import RequestsModel
from src.services.EmailService import email_service



router = APIRouter(prefix="/v1/health")


@router.get('', tags = ["Проверка Бэкенда"], 
            summary= "Проверить работу API",
            status_code= status.HTTP_200_OK)
async def get_health():
    return {"message": "OK"}



@router.get("/db_check", tags = ["Проверка Бэкенда"], 
            summary= "Проверить подключение к базе данных",
            status_code= status.HTTP_200_OK)
async def db_check(db: Session = Depends(get_session)):
    try:
        result = db.execute(text("SELECT 1"))
        return {
            "status": "success", 
            "message": "Database connection is working",
            "database": str(engine.url)
        }
    except Exception as e:
        return {
            "status": "error", 
            "message": f"Database connection failed: {str(e)}"
        }

@router.post('/setup_db', tags=["Проверка Бэкенда"], summary= "Инициализация БД")
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        return {"message": "Database setup successfully"}
    
    
    

@router.get("/smtp-test", tags = ["Проверка Бэкенда"], summary= "Тестирование конфигурации SMTP")
async def test_smtp_configuration():
    result = await email_service.test_connection()
    
    if result["success"]:
        return {
            "status": "success",
            "message": "SMTP configuration is correct",
            "details": result
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "status": "error",
                "message": "SMTP configuration failed",
                "details": result
            }
        )   

@router.post("/test-email", tags = ["Проверка Бэкенда"], summary="Отправка тестового сообщения")
async def send_test_email(email: str):
    success = await email_service.send_verification_email(
        email=email,
        token="test-token-123",
        username="Test User"
    )
    
    if success:
        return {"message": "Test email sent successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send test email"
        )