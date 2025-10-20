from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from sqlalchemy import select
from src.dependencies.services import PromoServiceDep
from src.dependencies.auth import CurrentUser, AdminUser
from src.database.deps import SessionDep
from src.schemas.promo import ActivatePromoResponse, ActivatePromoRequest, ApplyPromoRequest, ApplyPromoResponse, UserPromoCodeResponse, PromoCodeUsageResponse, PromoCodeResponse, PromoCodeCreate




router = APIRouter(prefix="/v1/promo", tags=["Промокоды (Система недоработана)"])



@router.post("/activate", response_model=ActivatePromoResponse, summary="Активировать промокод (Система недоработана)")
async def activate_promo_code(
    request: ActivatePromoRequest,
    promo_service: PromoServiceDep,
    current_user: CurrentUser     
):
    result = await promo_service.activate_promo_code(
        promo_code=request.promo_code,
        user_id=current_user.id
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    return result

@router.post("/apply", response_model=ApplyPromoResponse, summary="Применить промокод (Система недоработана)")
async def apply_promo_code(
    request: ApplyPromoRequest,
    promo_service: PromoServiceDep, 
    current_user: CurrentUser       
):
    result = await promo_service.apply_promo_code(
        user_id=current_user.id,
        purchase_amount=request.purchase_amount
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    return result

@router.get("/active", response_model=List[UserPromoCodeResponse], summary="Получить активные промокоды пользователя (Система недоработана)")
async def get_active_promos(
    promo_service: PromoServiceDep,  
    current_user: CurrentUser        
):

    return await promo_service.get_user_active_promos(current_user.id)

@router.get("/history", response_model=List[PromoCodeUsageResponse], summary="История использованных промокодов пользвоателя (Система недоработана)")
async def get_promo_history(
    promo_service: PromoServiceDep,  
    current_user: CurrentUser,       
    limit: int = Query(20, ge=1, le=100)
):

    history = await promo_service.get_user_promo_history(
        user_id=current_user.id,
        limit=limit
    )
    return history




@router.post("/admin/create", response_model=PromoCodeResponse, summary="Создать промокод (админ) (Система недоработана)")
async def create_promo_code(
    promo_data: PromoCodeCreate,
    promo_service: PromoServiceDep,  
    admin_user: AdminUser,           
):
    try:
        promo = await promo_service.create_promo_code(promo_data)
        return promo
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/admin/list", response_model=List[PromoCodeResponse], summary="Получить лист всех промокодов (админ) (Система недоработана)")
async def get_promo_codes_list(
    session: SessionDep,
    admin_user: AdminUser,           
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    from src.models.promo import PromoCodeModel, PromoStatus
    
    query = select(PromoCodeModel)
    
    if status:
        query = query.where(PromoCodeModel.status == PromoStatus(status))
    
    result = await session.execute(
        query.order_by(PromoCodeModel.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    
    promos = result.scalars().all()
    return promos



