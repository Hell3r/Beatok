from fastapi import APIRouter, Depends, HTTPException
from typing import List
from typing_extensions import Annotated
import logging
from src.services.DownlandService import DownloadService
from src.dependencies.auth import CurrentUserId
from src.database.deps import SessionDep
from src.dependencies.services import PurchaseServiceDep, DownloadServiceDep, EmailServiceDep
from src.schemas.purchase import (
    PurchaseBeatRequest,
    PurchaseBeatResponse,
    AvailableTariffResponse,
    UserPurchaseResponse
)

router = APIRouter(prefix="/purchase", tags=["Покупки"])
logger = logging.getLogger(__name__)

@router.post("/beat", response_model=PurchaseBeatResponse, summary="Купить бит")
async def purchase_beat(
    request: PurchaseBeatRequest,
    user_id: CurrentUserId,
    purchase_service: PurchaseServiceDep,
    download_service: DownloadServiceDep,
    email_service: EmailServiceDep,
    session: SessionDep
):
    try:
        user_result = await session.execute(
            select(UsersModel.email, UsersModel.username).where(UsersModel.id == user_id)
        )
        user_data = user_result.first()
        if not user_data:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        purchaser_email, purchaser_username = user_data
        
        beat_result = await session.execute(
            select(BeatModel).where(BeatModel.id == request.beat_id)
        )
        beat = beat_result.scalar_one_or_none()
        if not beat:
            raise HTTPException(status_code=404, detail="Бит не найден")
        
        purchase_result = await purchase_service.purchase_beat(
            beat_id=request.beat_id,
            tariff_name=request.tariff_name,
            purchaser_id=user_id
        )

        download_token = await download_service.create_download_token(
            session=session,
            user_id=user_id,
            beat_id=request.beat_id,
            purchase_id=purchase_result["purchase_id"],
            validity_hours=72  # 3 дня
        )

        download_url = f"{email_service.base_url}/api/v1/download/beat/{download_token}"

        import asyncio
        asyncio.create_task(
            email_service.send_beat_download_link(
                to_email=purchaser_email,
                username=purchaser_username,
                beat_name=beat.name,
                download_url=download_url,
                purchase_details=purchase_result,
                expires_in_hours=72
            )
        )
        
        logger.info(f"✅ Покупка #{purchase_result['purchase_id']}. Ссылка отправлена на {purchaser_email}")
 
        purchase_result["download_url"] = download_url
        purchase_result["expires_in_hours"] = 72
        
        return PurchaseBeatResponse(**purchase_result)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Purchase error: {e}")
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")

@router.get("/beat/{beat_id}/tariffs", response_model=List[AvailableTariffResponse], summary="Доступные тарифы для бита")
async def get_available_tariffs(
    beat_id: int,
    user_id: CurrentUserId,
    purchase_service: PurchaseServiceDep
):
    try:
        tariffs = await purchase_service.get_available_tariffs_for_beat(beat_id, user_id)
        return tariffs
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка получения тарифов")

@router.get("/my", response_model=List[UserPurchaseResponse], summary="Мои покупки")
async def get_my_purchases(
    user_id: CurrentUserId,
    purchase_service: PurchaseServiceDep
):
    try:
        purchases = await purchase_service.get_user_purchases(user_id)
        return purchases
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка получения покупок")
    
    
    
    
@router.get("/download/beat/{token}", summary = "Ссылка для скачивания бита")
async def download_beat_by_token(
    token: str,
    download_service: DownloadServiceDep,
    session: SessionDep
):
    file_info = await download_service.validate_download_token(session, token)
    
    if not file_info:
        raise HTTPException(
            status_code=404,
            detail="Ссылка недействительна, просрочена или превышен лимит скачиваний"
        )
    
    file_path = file_info["file_path"]
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    # Возвращаем файл
    from fastapi.responses import FileResponse
    
    return FileResponse(
        path=file_path,
        filename=file_info["file_name"],
        media_type="audio/wav",
        headers={
            "Content-Disposition": f"attachment; filename={file_info['file_name']}",
            "X-Beat-Name": file_info["beat_name"],
            "X-Downloads-Left": str(file_info["downloads_left"])
        }
    )
    
    
    
@router.get("/my-downloads")
async def get_my_downloads(
    user_id: CurrentUserId,
    download_service: DownloadServiceDep,
    session: SessionDep
):

    tokens = await download_service.get_user_active_tokens(session, user_id)
    
    downloads = []
    for token in tokens:
        downloads.append({
            "beat_id": token.beat_id,
            "beat_name": token.beat.name,
            "download_url": f"/download/beat/{token.token}",
            "expires_at": token.expires_at,
            "downloads_used": token.downloads_count,
            "downloads_left": token.max_downloads - token.downloads_count,
            "is_active": token.is_active
        })
    
    return {"downloads": downloads, "count": len(downloads)}