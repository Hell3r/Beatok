from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from src.models.downland_token import DownloadTokenModel
from src.models.beats import BeatModel
import secrets

class DownloadService:
    @staticmethod
    async def create_download_token(
        session: AsyncSession,
        user_id: int,
        beat_id: int,
        purchase_id: int,
        validity_hours: int = 72 
    ) -> str:
        
        await session.execute(
            update(DownloadTokenModel)
            .where(DownloadTokenModel.purchase_id == purchase_id)
            .where(DownloadTokenModel.is_active == True)
            .values(is_active=False)
        )

        token = DownloadTokenModel.generate_token()
        expires_at = datetime.utcnow() + timedelta(hours=validity_hours)
        
        download_token = DownloadTokenModel(
            token=token,
            user_id=user_id,
            beat_id=beat_id,
            purchase_id=purchase_id,
            expires_at=expires_at,
            max_downloads=5,
            is_active=True
        )
        
        session.add(download_token)
        await session.commit()
        
        return token
    
    @staticmethod
    async def validate_download_token(
        session: AsyncSession,
        token: str
    ) -> Optional[dict]:

        result = await session.execute(
            select(DownloadTokenModel)
            .where(DownloadTokenModel.token == token)
            .options(
                selectinload(DownloadTokenModel.beat),
                selectinload(DownloadTokenModel.user)
            )
        )
        
        download_token = result.scalar_one_or_none()
        
        if not download_token or not download_token.can_download:
            return None
        
        download_token.downloads_count += 1
        download_token.last_download_at = datetime.utcnow()

        if download_token.downloads_count >= download_token.max_downloads:
            download_token.is_active = False
        
        await session.commit()

        beat = download_token.beat
        if not beat.wav_path:
            return None
        
        from pathlib import Path
        AUDIO_STORAGE = Path("audio_storage")
        file_path = AUDIO_STORAGE / beat.wav_path
        
        return {
            "file_path": file_path,
            "file_name": f"{beat.name.replace(' ', '_')}.wav",
            "beat_name": beat.name,
            "user_id": download_token.user_id,
            "downloads_left": download_token.max_downloads - download_token.downloads_count,
            "expires_at": download_token.expires_at
        }
    
    @staticmethod
    async def get_user_active_tokens(
        session: AsyncSession,
        user_id: int
    ) -> list:
        result = await session.execute(
            select(DownloadTokenModel)
            .where(DownloadTokenModel.user_id == user_id)
            .where(DownloadTokenModel.is_active == True)
            .where(DownloadTokenModel.expires_at > datetime.utcnow())
            .options(selectinload(DownloadTokenModel.beat))
            .order_by(DownloadTokenModel.expires_at)
        )
        
        return result.scalars().all()