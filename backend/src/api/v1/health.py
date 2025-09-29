from fastapi import APIRouter, HTTPException, status, Depends, Response
from sqlalchemy import text
from sqlalchemy.orm import Session
from src.database.database import engine, get_session, Base
from src.models.users import UsersModel
from src.models.beat_bricing import BeatPricingModel
from src.models.beats import BeatModel
from src.models.tarrifs import TariffTemplateModel



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