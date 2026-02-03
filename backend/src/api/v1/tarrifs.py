from fastapi import APIRouter, HTTPException, status, Depends, Response
from sqlalchemy import text, select
from typing import List
from sqlalchemy.orm import Session
from src.database.database import engine, get_session, Base
from src.database.deps import SessionDep
from src.schemas.tarrifs import TarrifCreate, TarrifResponse
from src.models.tarrifs import TariffTemplateModel, TariffType



router = APIRouter(prefix = "/v1/tarrifs", tags = ["Тарифы"])



@router.post("/", response_model=TarrifResponse, summary="Добавить тариф")
async def create_tarrif(
    session: SessionDep,
    tarrif_data: TarrifCreate
):
    try:
        name_lower = tarrif_data.name.lower()
        tariff_type = TariffType.EXCLUSIVE if "exclusive" in name_lower or "эксклюзив" in name_lower else TariffType.LEASING

        tariff = TariffTemplateModel(
            name=tarrif_data.name,
            display_name=tarrif_data.display_name,
            description=tarrif_data.description,
            type=tariff_type
        )

        session.add(tariff)

        await session.commit()

        result = await session.execute(
            select(TariffTemplateModel).where(TariffTemplateModel.id == tariff.id)
        )
        tariff = result.scalar_one()

        print(f"Создан тариф: ID={tariff.id}, name={tariff.name}, type={tariff.type}")
        
        return tariff
        
    except Exception as e:
        await session.rollback()
        print(f"Ошибка создания тарифа: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        
        
        
        
@router.get("/", response_model= List[TarrifResponse], summary= "Получить все тарифы")
async def get_tarrifs (session: SessionDep):
    try:
        result = await session.execute(select(TariffTemplateModel))
        tarrifs = result.scalars().all()
        return tarrifs
    except Exception as e:
        await session.rollback()
        print(e)