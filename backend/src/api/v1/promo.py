from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from sqlalchemy import select
from decimal import Decimal
from src.dependencies.services import PromoServiceDep
from src.dependencies.auth import CurrentUser, AdminUser
from src.database.deps import SessionDep
from src.schemas.promo import *

router = APIRouter(prefix="/v1/promo", tags=["Промокоды"])

@router.post("/activate", response_model=ActivatePromoResponse, summary= "Активировать промокод")
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
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@router.post("/apply", response_model=ApplyPromoResponse, summary= "Применить Промокод")
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
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@router.get("/active", response_model=List[UserPromoCodeResponse], summary = "Получить мои активные промокоды")
async def get_active_promos(promo_service: PromoServiceDep, current_user: CurrentUser):
    return await promo_service.get_user_active_promos(current_user.id)

@router.post("/admin/create", response_model=PromoCodeResponse, summary="Создать промокод (админ)")
async def create_promo_code(
    promo_data: PromoCodeCreate,
    promo_service: PromoServiceDep,
    admin_user: AdminUser,
):
    try:
        promo = await promo_service.create_promo_code(promo_data)
        return promo
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/admin/list", response_model=List[PromoCodeResponse], summary= "Получить все промокоды (админ)")
async def get_promo_codes_list(session: SessionDep, admin_user: AdminUser):
    from src.models.promo import PromoCodeModel
    from sqlalchemy import select
    
    result = await session.execute(
        select(PromoCodeModel).order_by(PromoCodeModel.created_at.desc())
    )
    return result.scalars().all()





@router.post("/deposit-with-promo", summary="Пополнить баланс с применением промокода")
async def deposit_with_promo(
    promo_service: PromoServiceDep,
    session: SessionDep,
    current_user: CurrentUser,
    amount: float = Query(..., ge=1, description="Сумма пополнения"),
):
    from src.models.users import UsersModel
    

    apply_result = await promo_service.apply_promo_code(
        user_id=current_user.id,
        purchase_amount=amount
    )
    
    if not apply_result["success"]:
        raise HTTPException(status_code=400, detail=apply_result["message"])
    

    bonus = apply_result["bonus_amount"]
    total_amount = amount + bonus
    

    user_result = await session.execute(
        select(UsersModel).where(UsersModel.id == current_user.id)
    )
    user = user_result.scalar_one_or_none()
    
    user.balance += Decimal(str(total_amount))
    await session.commit()
    
    return {
        "success": True,
        "message": f"Баланс пополнен на {total_amount:.2f} руб. (из них {bonus:.2f} руб. бонус)",
        "deposit_amount": amount,
        "bonus_amount": bonus,
        "total_amount": total_amount,
        "new_balance": float(user.balance),
        "promo_code": apply_result["promo_code"]
    }
    
    
    
    
@router.post("/deposit", summary="Пополнить баланс")
async def deposit_balance(
    session: SessionDep,
    current_user: CurrentUser,
    amount: float = Query(..., ge=1, description="Сумма пополнения"),
):
    from src.models.users import UsersModel
    
    user_result = await session.execute(
        select(UsersModel).where(UsersModel.id == current_user.id)
    )
    user = user_result.scalar_one_or_none()
    
    user.balance += Decimal(str(amount))
    await session.commit()
    
    return {
        "success": True,
        "message": f"Баланс пополнен на {amount:.2f} руб.",
        "new_balance": float(user.balance)
    }