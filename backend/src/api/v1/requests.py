from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Depends
from typing import Optional, List
from typing_extensions import Annotated
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from mutagen import File as MutagenFile
from pathlib import Path
from src.models.users import UsersModel
from src.database.deps import SessionDep
from src.models.requests import RequestsModel
from src.schemas.requests import RequestsSchema, RequestsResponse, RequestCreate
from src.services.AuthService import get_current_user
from src.dependencies.auth import get_current_user_id
from pydantic import BaseModel


class User(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool = False

    class Config:
        from_attributes = True


router = APIRouter(prefix="/v1/requests", tags = ["Заявки"])


from src.telegram_bot import send_support_request_to_telegram

@router.post("/", response_model=RequestsResponse, summary="Создать заявку")
async def create_request(
    session: SessionDep,
    request_data: RequestCreate,
    current_user: User = Depends(get_current_user)
):
    db_request = RequestsModel(
        user_id=current_user.id,
        **request_data.dict()
    )
    
    session.add(db_request)
    await session.commit()
    await session.refresh(db_request)

    user_info = {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    }
    
    await send_support_request_to_telegram(
        request_data.dict(),
        user_info
    )
    
    return db_request


@router.get("/", response_model=List[RequestsResponse], summary="Получить все заявки")
async def get_all_requests(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100
):
    result = await session.execute(
        select(RequestsModel)
        .options(selectinload(RequestsModel.user))
        .offset(skip)
        .limit(limit)
        .order_by(RequestsModel.created_at.desc())
    )
    
    requests = result.scalars().all()
    return requests


@router.get("/my-requests", response_model=List[RequestsResponse], summary="Получить мои заявки")
async def get_my_requests(
    session: SessionDep,
    current_user: UsersModel = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):

    result = await session.execute(
        select(RequestsModel)
        .options(selectinload(RequestsModel.user))
        .where(RequestsModel.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .order_by(RequestsModel.created_at.desc())
    )
    
    requests = result.scalars().all()
    return requests


@router.get("/{request_id}", response_model=RequestsResponse, summary="Получить заявку по ID")
async def get_request_by_id(
    session: SessionDep,
    request_id: int,
    current_user: UsersModel = Depends(get_current_user)
):
    result = await session.execute(
        select(RequestsModel)
        .options(selectinload(RequestsModel.user))
        .where(RequestsModel.id == request_id)
    )
    
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    if request.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Нет доступа к этой заявке")
    
    return request