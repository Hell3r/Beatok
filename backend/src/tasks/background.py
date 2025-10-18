import asyncio
import logging
from sqlalchemy import delete
from datetime import datetime
from src.models.email_verification import EmailVerificationModel

logger = logging.getLogger(__name__)

async def cleanup_expired_tokens(session) -> int:
    try:
        result = await session.execute(
            delete(EmailVerificationModel).where(
                (EmailVerificationModel.expires_at < datetime.utcnow()) |
                (EmailVerificationModel.is_used == True)
            )
        )
        
        deleted_count = result.rowcount
        await session.commit()
        
        logger.info(f"Cleaned up {deleted_count} expired/used verification tokens")
        return deleted_count
        
    except Exception as e:
        await session.rollback()
        logger.error(f"Error cleaning up tokens: {str(e)}")
        return 0

class BackgroundTaskManager:
    def __init__(self):
        self.cleanup_task = None
        self.is_running = False
    
    async def _cleanup_task(self):
        from src.database import async_session_factory
        
        async with async_session_factory() as session:
            try:
                deleted_count = await cleanup_expired_tokens(session)
                if deleted_count > 0:
                    logger.info(f"Cleanup completed: removed {deleted_count} tokens")
            except Exception as e:
                logger.error(f"Cleanup task failed: {str(e)}")
    
    async def _cleanup_loop(self):
        while self.is_running:
            try:
                await asyncio.sleep(2 * 60 * 60)
                await self._cleanup_task()
            except Exception as e:
                logger.error(f"Cleanup loop error: {str(e)}")
                await asyncio.sleep(300)
    def start_cleanup_tasks(self):
        if self.is_running:
            return
            
        self.is_running = True
        self.cleanup_task = asyncio.create_task(self._cleanup_loop())
        logger.info("Background cleanup task started (every 2 hours)")
    
    def shutdown(self):
        self.is_running = False
        if self.cleanup_task:
            self.cleanup_task.cancel()
        logger.info("Background tasks stopped")
        
task_manager = BackgroundTaskManager()