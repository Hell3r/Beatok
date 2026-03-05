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
from src.schemas.requests import RequestsSchema, RequestsResponse, RequestCreate, RequestResponseUpdate
from src.services.AuthService import get_current_user
from src.dependencies.auth import get_current_user_id
from src.services.EmailService import email_service
from pydantic import BaseModel
from datetime import datetime


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
    current_user: UsersModel = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    try:
        print(f"🔍 Getting all requests. User ID: {current_user.id}, Role: {current_user.role}")

        if current_user.role not in ('admin', 'moderator'):
            print(f"⛔ Access denied for user {current_user.id} with role {current_user.role}")
            raise HTTPException(status_code=403, detail="Нет доступа")
        
        print(f"✅ User is admin, executing query with skip={skip}, limit={limit}")
        
        query = select(RequestsModel).options(
            selectinload(RequestsModel.user)
        ).where(
            RequestsModel.status != "closed"
        ).offset(skip).limit(limit).order_by(
            RequestsModel.created_at.desc()
        )
        
        result = await session.execute(query)
        requests = result.scalars().all()
        
        print(f"✅ Found {len(requests)} requests")
        
        return requests
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in get_all_requests: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


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

    if request.user_id != current_user.id and current_user.role not in ('admin', 'moderator'):
        raise HTTPException(status_code=403, detail="Нет доступа к этой заявке")
    
    return request


@router.patch("/{request_id}", response_model=RequestsResponse, summary="Обновить статус заявки")
async def update_request_status(
    request_id: int,
    session: SessionDep,
    status: str = Form(..., description="Новый статус заявки"),
    current_user: UsersModel = Depends(get_current_user)
):
    if current_user.role not in ('admin', 'moderator'):
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    result = await session.execute(
        select(RequestsModel).where(RequestsModel.id == request_id)
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    valid_statuses = ["pending", "in_progress", "resolved", "closed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Некорректный статус. Допустимые значения: {', '.join(valid_statuses)}")
    
    request.status = status
    await session.commit()
    await session.refresh(request)
    
    return request


@router.patch("/{request_id}/respond", response_model=RequestsResponse, summary="Ответить на заявку")
async def respond_to_request(
    request_id: int,
    session: SessionDep,
    response_data: RequestResponseUpdate,
    current_user: UsersModel = Depends(get_current_user)
):
    if current_user.role not in ('admin', 'moderator'):
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    result = await session.execute(
        select(RequestsModel)
        .options(selectinload(RequestsModel.user))
        .where(RequestsModel.id == request_id)
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    request.response = response_data.response
    request.response_at = datetime.utcnow()
    request.status = "closed"
    
    await session.commit()
    await session.refresh(request)

    if request.user and request.user.email:
        try:
            await email_service.send_request_response_email(
                to_email=request.user.email,
                username=request.user.username,
                request_title=request.title,
                request_description=request.description or "",
                response_text=response_data.response,
                problem_type=request.problem_type
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send response email: {e}")
    
    return request
