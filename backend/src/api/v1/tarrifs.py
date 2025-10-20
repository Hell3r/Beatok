from fastapi import APIRouter, HTTPException, status, Depends, Response
from sqlalchemy import text, select
from typing import List
from sqlalchemy.orm import Session
from src.database.database import engine, get_session, Base
from src.database.deps import SessionDep
from src.schemas.tarrifs import TarrifCreate, TarrifResponse
from src.models.tarrifs import TariffTemplateModel



router = APIRouter(prefix = "/v1/tarrifs", tags = ["Тарифы"])



@router.post("/", response_model= TarrifCreate, summary = "Добавить тариф")
async def create_tarrif(
    session : SessionDep,
    tarrif_data : TarrifCreate
):
    try:
        tarrif = TariffTemplateModel(
            name = tarrif_data.name,
            display_name = tarrif_data.display_name,
            description = tarrif_data.description
        )
        session.add(tarrif)
        await session.commit()
        await session.refresh(tarrif)
        
        
        return tarrif
        
    except Exception as e:
        await session.rollback()
        print(e)
        
        
        
        
@router.get("/", response_model= List[TarrifResponse], summary= "Получить все тарифы")
async def get_tarrifs (session: SessionDep):
    try:
        result = await session.execute(select(TariffTemplateModel))
        tarrifs = result.scalars().all()
        return tarrifs
    except Exception as e:
        await session.rollback()
        print(e)