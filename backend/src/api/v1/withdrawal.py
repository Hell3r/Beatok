from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from src.dependencies.auth import CurrentUserId, AdminUser
from src.dependencies.services import WithdrawalServiceDep, YooKassaServiceDep
from src.schemas.withdrawal import (
    WithdrawalCreate, 
    WithdrawalResponse, 
    WithdrawalUpdate,
    WithdrawalStats
)

router = APIRouter(prefix="/withdrawal", tags=["Выводы"])

@router.post("/", response_model=WithdrawalResponse, summary="Создать запрос на вывод")
async def create_withdrawal(
    withdrawal_data: WithdrawalCreate,
    user_id: CurrentUserId,
    withdrawal_service: WithdrawalServiceDep,
    yookassa_service: YooKassaServiceDep,
):
    try:
        withdrawal = await withdrawal_service.create_withdrawal(withdrawal_data, user_id)
        
        try:
            await withdrawal_service.process_withdrawal(withdrawal.id, yookassa_service)
        except Exception as processing_error:
            print(f"Processing error: {processing_error}")
        
        return withdrawal
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Server error: {e}")
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")

@router.get("/my", response_model=List[WithdrawalResponse], summary = "Выводы авторизованного пользователя")
async def get_my_withdrawals(
    user_id: CurrentUserId,
    withdrawal_service: WithdrawalServiceDep,
    skip: int = 0,
    limit: int = 100
):
    withdrawals = await withdrawal_service.get_user_withdrawals(user_id, skip, limit)
    return withdrawals

@router.get("/stats", response_model=WithdrawalStats, summary="Статусы выводов авторизованного пользователя")
async def get_withdrawal_stats(
    user_id: CurrentUserId,
    withdrawal_service: WithdrawalServiceDep
):
    stats = await withdrawal_service.get_withdrawal_stats(user_id)
    return stats


@router.get("/admin/pending", response_model=List[WithdrawalResponse], summary="Выводы со статусом pending (Админ)")
async def get_pending_withdrawals(
    admin: AdminUser,
    withdrawal_service: WithdrawalServiceDep
):
    withdrawals = await withdrawal_service.get_pending_withdrawals()
    return withdrawals

@router.patch("/admin/{withdrawal_id}", response_model=WithdrawalResponse, summary="Статус вывода (Админ)")
async def update_withdrawal_status(
    withdrawal_id: int,
    update_data: WithdrawalUpdate,
    admin: AdminUser,
    withdrawal_service: WithdrawalServiceDep
):
    withdrawal = await withdrawal_service.get_withdrawal_by_id(withdrawal_id)
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Вывод не найден")

    try:
        if update_data.status.value == "completed":
            withdrawal = await withdrawal_service.complete_withdrawal(withdrawal_id)
        elif update_data.status.value == "rejected":
            withdrawal = await withdrawal_service.reject_withdrawal(
                withdrawal_id, update_data.rejection_reason
            )
        elif update_data.status.value == "failed":
            withdrawal = await withdrawal_service.fail_withdrawal(
                withdrawal_id, update_data.rejection_reason
            )
        else:
            withdrawal.status = update_data.status
            await withdrawal_service.db.commit()

        if update_data.admin_notes:
            withdrawal.admin_notes = update_data.admin_notes
            await withdrawal_service.db.commit()

        return withdrawal

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/admin/stats", response_model=WithdrawalStats, summary="Статусы всех выводов (Админ)")
async def get_admin_withdrawal_stats(
    admin: AdminUser,
    withdrawal_service: WithdrawalServiceDep
):
    stats = await withdrawal_service.get_withdrawal_stats()
    return stats    