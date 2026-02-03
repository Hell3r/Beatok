from fastapi import APIRouter, HTTPException, Depends, Query, Request
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime
import os
from src.database.database import get_session
from src.models.downland_token import DownloadTokenModel
from src.models.beats import BeatModel
from src.services.template_service import template_service
from src.scripts.zip_creator import ZipCreator
import logging

router = APIRouter(prefix="/purchase/download", tags=["Загрузки"])
logger = logging.getLogger(__name__)

@router.get("/confirm/{token}", response_class=HTMLResponse, summary = "Открытие страницы подтверждения скачивания (по токену)")
async def download_confirm(
    token: str,
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    try:
        result = await session.execute(
            select(DownloadTokenModel)
            .where(DownloadTokenModel.token == token)
            .options(selectinload(DownloadTokenModel.beat))
        )
        
        download_token = result.scalar_one_or_none()
        
        if not download_token or not download_token.can_download:
            return HTMLResponse(
                content=template_service.render_error_page(
                    error_title="❌ Ссылка недействительна",
                    error_message="Возможно, ссылка просрочена, уже использована или достигнут лимит скачиваний.",
                    home_url="/"
                ),
                status_code=404
            )
        
        beat = download_token.beat

        BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
        download_action_url = f"{BASE_URL}/purchase/download/zip/{token}"
        direct_download_url = f"{BASE_URL}/purchase/download/direct/{token}"

        html_content = template_service.render_download_confirm(
            beat_name=beat.name,
            downloads_left=download_token.max_downloads - download_token.downloads_count,
            expires_at=download_token.expires_at,
            download_action_url=download_action_url,
            direct_download_url=direct_download_url
        )
        
        return HTMLResponse(content=html_content)
        
    except Exception as e:
        logger.error(f"Error in download confirm: {e}")
        return HTMLResponse(
            content=template_service.render_error_page(
                error_title="Ошибка сервера",
                error_message="Произошла внутренняя ошибка. Пожалуйста, попробуйте позже."
            ),
            status_code=500
        )


@router.get("/zip/{token}", summary = "Скачивание архива с битов (по токену)")
async def download_zip(
    token: str,
    session: AsyncSession = Depends(get_session)
):
    try:
        result = await session.execute(
            select(DownloadTokenModel)
            .where(DownloadTokenModel.token == token)
            .options(selectinload(DownloadTokenModel.beat))
        )
        
        download_token = result.scalar_one_or_none()
        
        if not download_token or not download_token.can_download:
            raise HTTPException(
                status_code=404,
                detail="Токен недействителен или достигнут лимит скачиваний"
            )
            
        download_token.downloads_count += 1
        download_token.last_download_at = datetime.utcnow()
        
        if download_token.downloads_count >= download_token.max_downloads:
            download_token.is_active = False
        
        await session.commit()
        
        beat = download_token.beat

        from pathlib import Path
        AUDIO_STORAGE = Path("audio_storage")
        file_path = AUDIO_STORAGE / beat.wav_path
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Файл не найден на сервере")

        purchase_info = {
            "purchase_id": download_token.purchase_id,
            "tariff_name": "Standard", 
            "price": 0, 
            "purchase_date": download_token.created_at.strftime('%d.%m.%Y %H:%M')
        }

        zip_buffer = ZipCreator.create_beat_zip(
            file_path=file_path,
            beat_name=beat.name,
            purchase_info=purchase_info,
            downloads_left=download_token.max_downloads - download_token.downloads_count,
            expires_at=download_token.expires_at
        )

        zip_filename = ZipCreator.get_zip_filename(beat.name)

        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename=\"{zip_filename}\"",
                "Content-Type": "application/zip",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating ZIP: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Ошибка при создании архива")


@router.get("/direct/{token}", summary = "Прямая ссылка на скачивание WAV (по токену)")
async def download_direct(
    token: str,
    session: AsyncSession = Depends(get_session)
):
    try:
        result = await session.execute(
            select(DownloadTokenModel)
            .where(DownloadTokenModel.token == token)
            .options(selectinload(DownloadTokenModel.beat))
        )
        
        download_token = result.scalar_one_or_none()
        
        if not download_token or not download_token.can_download:
            raise HTTPException(status_code=404, detail="Токен недействителен")

        download_token.downloads_count += 1
        download_token.last_download_at = datetime.utcnow()
        
        if download_token.downloads_count >= download_token.max_downloads:
            download_token.is_active = False
        
        await session.commit()
        
        beat = download_token.beat

        from pathlib import Path
        from fastapi.responses import FileResponse
        
        AUDIO_STORAGE = Path("audio_storage")
        file_path = AUDIO_STORAGE / beat.wav_path
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Файл не найден")

        safe_filename = ZipCreator._safe_filename(beat.name) + ".wav"

        return FileResponse(
            path=file_path,
            filename=safe_filename,
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f"attachment; filename=\"{safe_filename}\"",
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        )
        
    except Exception as e:
        logger.error(f"Direct download error: {e}")
        raise HTTPException(status_code=500, detail="Ошибка скачивания")