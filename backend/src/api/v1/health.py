from fastapi import APIRouter, HTTPException, status, Depends, Response
from sqlalchemy import text
from sqlalchemy.orm import Session
from src.database.database import engine, get_session

router = APIRouter(prefix="/v1/health")


@router.get('/health', tags = ["Проверка Бэкенда"], 
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
