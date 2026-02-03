import asyncio
import logging
import os
import shutil
from pathlib import Path
from sqlalchemy import delete, select
from datetime import datetime, timedelta
from src.models.email_verification import EmailVerificationModel
from src.models.beats import BeatModel
from src.models.downland_token import DownloadTokenModel

logger = logging.getLogger(__name__)

AUDIO_STORAGE = Path("audio_storage")

AUDIO_EXTENSIONS = ['.wav', '.mp3']





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
        
        if deleted_count > 0:
            logger.info(f"Cleaned up {deleted_count} expired/used verification tokens")
        return deleted_count
        
    except Exception as e:
        await session.rollback()
        logger.error(f"Error cleaning up verification tokens: {str(e)}")
        return 0

async def cleanup_expired_download_tokens(session) -> int:
    try:
        result = await session.execute(
            delete(DownloadTokenModel).where(
                (DownloadTokenModel.expires_at < datetime.utcnow()) |
                (DownloadTokenModel.is_active == False)
            )
        )
        
        deleted_count = result.rowcount
        await session.commit()
        
        if deleted_count > 0:
            logger.info(f"Cleaned up {deleted_count} expired/inactive download tokens")
        return deleted_count
        
    except Exception as e:
        await session.rollback()
        logger.error(f"Error cleaning up download tokens: {str(e)}")
        return 0

async def check_disk_space():
    stats = {
        'checked_at': datetime.now().isoformat(),
        'storage_exists': False,
        'total_gb': 0,
        'used_gb': 0,
        'free_gb': 0,
        'free_percent': 0,
        'warnings': [],
        'status': 'OK'
    }
    
    try:
        if not AUDIO_STORAGE.exists():
            stats['warnings'].append(f"Storage directory does not exist: {AUDIO_STORAGE}")
            stats['status'] = 'ERROR'
            logger.warning(f"Storage directory does not exist: {AUDIO_STORAGE}")
            return stats
        
        stats['storage_exists'] = True

        total, used, free = shutil.disk_usage(AUDIO_STORAGE)

        total_gb = total / (1024**3)
        used_gb = used / (1024**3)
        free_gb = free / (1024**3)
        free_percent = (free / total) * 100 if total > 0 else 0
        
        stats.update({
            'total_gb': round(total_gb, 2),
            'used_gb': round(used_gb, 2),
            'free_gb': round(free_gb, 2),
            'free_percent': round(free_percent, 1)
        })

        logger.info(
            f"Disk space check: {free_gb:.1f}GB free of {total_gb:.1f}GB "
            f"({free_percent:.1f}% free)"
        )

        if free_gb < 1:
            warning_msg = f"CRITICAL: Less than 1GB free ({free_gb:.1f}GB, {free_percent:.1f}%)!"
            stats['warnings'].append(warning_msg)
            stats['status'] = 'CRITICAL'
            logger.critical(warning_msg)

        elif free_gb < 5:
            warning_msg = f"WARNING: Low disk space ({free_gb:.1f}GB free, {free_percent:.1f}%)"
            stats['warnings'].append(warning_msg)
            stats['status'] = 'WARNING'
            logger.warning(warning_msg)
            
        elif free_gb < 10:
            warning_msg = f"Notice: Disk space getting low ({free_gb:.1f}GB free, {free_percent:.1f}%)"
            stats['warnings'].append(warning_msg)
            stats['status'] = 'NOTICE'
            logger.info(warning_msg)
        
        if AUDIO_STORAGE.exists():
            total_files = 0
            total_size = 0
            wav_files = 0
            mp3_files = 0
            
            for item in AUDIO_STORAGE.rglob("*"):
                if item.is_file():
                    total_files += 1
                    file_size = item.stat().st_size
                    total_size += file_size
                    
                    if item.suffix.lower() == '.wav':
                        wav_files += 1
                    elif item.suffix.lower() == '.mp3':
                        mp3_files += 1
            
            stats['file_count'] = total_files
            stats['total_size_gb'] = round(total_size / (1024**3), 2)
            stats['wav_files'] = wav_files
            stats['mp3_files'] = mp3_files
            
            logger.info(
                f"Storage contents: {total_files} files "
                f"({wav_files} WAV, {mp3_files} MP3) "
                f"total {total_size/(1024**3):.1f}GB"
            )
        
        return stats
        
    except Exception as e:
        error_msg = f"Error checking disk space: {str(e)}"
        stats['warnings'].append(error_msg)
        stats['status'] = 'ERROR'
        logger.error(error_msg, exc_info=True)
        return stats

async def cleanup_sold_beats_files(session) -> dict:
    stats = {
        'sold_beats_found': 0,
        'total_files_deleted': 0,
        'wav_deleted': 0,
        'mp3_deleted': 0,
        'errors': []
    }
    
    try:
        result = await session.execute(
            select(BeatModel).where(
                BeatModel.status == "SOLD"
            )
        )
        
        sold_beats = result.scalars().all()
        stats['sold_beats_found'] = len(sold_beats)
        
        logger.info(f"Found {len(sold_beats)} beats with SOLD status")

        for beat in sold_beats:
            try:
                files_deleted_for_beat = 0

                if beat.wav_path:
                    wav_path = AUDIO_STORAGE / beat.wav_path
                    if wav_path.exists():
                        wav_size = wav_path.stat().st_size
                        wav_path.unlink()
                        
                        stats['wav_deleted'] += 1
                        stats['total_files_deleted'] += 1
                        files_deleted_for_beat += 1
                        
                        logger.info(
                            f"Deleted SOLD beat WAV file: ID={beat.id}, "
                            f"name='{beat.name}', size={wav_size/1024/1024:.2f}MB"
                        )

                if hasattr(beat, 'mp3_path') and beat.mp3_path:
                    mp3_path = AUDIO_STORAGE / beat.mp3_path
                    if mp3_path.exists():
                        mp3_size = mp3_path.stat().st_size
                        mp3_path.unlink()
                        
                        stats['mp3_deleted'] += 1
                        stats['total_files_deleted'] += 1
                        files_deleted_for_beat += 1
                        
                        logger.info(
                            f"Deleted SOLD beat MP3 file: ID={beat.id}, "
                            f"name='{beat.name}', size={mp3_size/1024/1024:.2f}MB"
                        )

                elif beat.wav_path:
                    mp3_path = AUDIO_STORAGE / beat.wav_path.replace('.wav', '.mp3')
                    if mp3_path.exists():
                        mp3_size = mp3_path.stat().st_size
                        mp3_path.unlink()
                        
                        stats['mp3_deleted'] += 1
                        stats['total_files_deleted'] += 1
                        files_deleted_for_beat += 1
                        
                        logger.info(
                            f"Deleted SOLD beat MP3 file (auto-found): ID={beat.id}, "
                            f"name='{beat.name}', size={mp3_size/1024/1024:.2f}MB"
                        )
                
                if files_deleted_for_beat == 0:
                    logger.debug(f"No audio files found for SOLD beat ID {beat.id}")
                    
            except Exception as e:
                error_msg = f"Error deleting files for beat ID {beat.id}: {str(e)}"
                stats['errors'].append(error_msg)
                logger.error(error_msg)

        empty_dirs_deleted = 0
        if AUDIO_STORAGE.exists():
            for root, dirs, files in os.walk(AUDIO_STORAGE, topdown=False):
                for dir_name in dirs:
                    dir_path = Path(root) / dir_name
                    try:
                        if dir_path != AUDIO_STORAGE and not any(dir_path.iterdir()):
                            dir_path.rmdir()
                            empty_dirs_deleted += 1
                            logger.debug(f"Deleted empty directory: {dir_path}")
                    except Exception as e:
                        pass
        
        if empty_dirs_deleted > 0:
            logger.info(f"Deleted {empty_dirs_deleted} empty directories")

        if stats['total_files_deleted'] > 0:
            logger.info(
                f"SOLD beats cleanup completed: "
                f"{stats['total_files_deleted']} files deleted "
                f"(WAV: {stats['wav_deleted']}, MP3: {stats['mp3_deleted']}) "
                f"from {stats['sold_beats_found']} SOLD beats"
            )
        else:
            logger.info(
                f"No files to delete for {stats['sold_beats_found']} SOLD beats"
            )
        
        return stats
        
    except Exception as e:
        error_msg = f"General error in SOLD beats cleanup: {str(e)}"
        stats['errors'].append(error_msg)
        logger.error(error_msg, exc_info=True)
        return stats

class BackgroundTaskManager:
    def __init__(self):
        self.tasks = {}
        self.is_running = False
        self.last_disk_check = None
        self.low_space_warnings_sent = 0
    
    async def _run_token_cleanup(self):
        from src.database.database import async_session_factory
        
        while self.is_running:
            try:
                async with async_session_factory() as session:
                    await cleanup_expired_tokens(session)
                    await cleanup_expired_download_tokens(session)

                await asyncio.sleep(2 * 60 * 60)
                
            except asyncio.CancelledError:
                logger.info("Token cleanup task cancelled")
                break
            except Exception as e:
                logger.error(f"Token cleanup task error: {str(e)}")
                await asyncio.sleep(300)
    
    async def _run_sold_beats_cleanup(self):
        from src.database.database import async_session_factory
        
        while self.is_running:
            try:
                logger.info("Starting SOLD beats file cleanup (WAV & MP3)...")
                
                async with async_session_factory() as session:
                    stats = await cleanup_sold_beats_files(session)
                    
                    if stats['total_files_deleted'] > 0:
                        logger.info(
                            f"SOLD beats cleanup: {stats['total_files_deleted']} files deleted "
                            f"(WAV: {stats['wav_deleted']}, MP3: {stats['mp3_deleted']})"
                        )

                await asyncio.sleep(24 * 60 * 60)
                
            except asyncio.CancelledError:
                logger.info("SOLD beats cleanup task cancelled")
                break 
            except Exception as e:
                logger.error(f"SOLD beats cleanup task error: {str(e)}")
                await asyncio.sleep(3600)  # Ждем 1 час при ошибке
                
                
    async def _run_promotion_check(self):
        from src.database.database import async_session_factory
        from src.services.PromotionService import PromotionService
        
        while self.is_running:
            try:
                logger.info("Starting promotion check...")
                
                async with async_session_factory() as session:
                    service = PromotionService(session)
                    expired_count = await service.check_expired_promotions()
                    
                    if expired_count > 0:
                        logger.info(f"Deactivated {expired_count} expired promotions")
                
                # Ждем 1 час
                await asyncio.sleep(60 * 60)
                
            except asyncio.CancelledError:
                logger.info("Promotion check task cancelled")
                break
            except Exception as e:
                logger.error(f"Promotion check error: {str(e)}")
                await asyncio.sleep(300)
    
    async def _run_disk_space_check(self):
        while self.is_running:
            try:
                logger.info("Starting disk space check...")

                disk_stats = await check_disk_space()
                self.last_disk_check = datetime.now()
                
                if disk_stats.get('free_gb', 100) < 1:
                    logger.critical("CRITICAL: Less than 1GB free! Starting emergency cleanup...")
                    
                    from src.database.database import async_session_factory
                    async with async_session_factory() as session:
                        cleanup_stats = await cleanup_sold_beats_files(session)
                        
                        if cleanup_stats['total_files_deleted'] > 0:
                            logger.info(
                                f"Emergency cleanup freed {cleanup_stats['total_files_deleted']} files "
                                f"({cleanup_stats['wav_deleted']} WAV, {cleanup_stats['mp3_deleted']} MP3)"
                            )

                            disk_stats_after = await check_disk_space()
                            
                            freed_gb = disk_stats_after.get('free_gb', 0) - disk_stats.get('free_gb', 0)
                            if freed_gb > 0:
                                logger.info(f"Emergency cleanup freed approximately {freed_gb:.1f}GB")

                elif disk_stats.get('free_gb', 100) < 5:
                    if self.low_space_warnings_sent < 10:
                        logger.warning(
                            f"Low disk space: {disk_stats.get('free_gb', 0):.1f}GB free "
                            f"({disk_stats.get('free_percent', 0):.1f}%). "
                            f"Consider cleaning up old files."
                        )
                        self.low_space_warnings_sent += 1

                elif disk_stats.get('free_gb', 0) > 10:
                    if self.low_space_warnings_sent > 0:
                        self.low_space_warnings_sent = 0
                        logger.info("Disk space is back to normal levels")

                await asyncio.sleep(6 * 60 * 60)
                
            except asyncio.CancelledError:
                logger.info("Disk space check task cancelled")
                break
            except Exception as e:
                logger.error(f"Disk space check error: {str(e)}")
                await asyncio.sleep(3600)
    
    async def _run_storage_report(self):
        while self.is_running:
            try:
                logger.info("Generating daily storage report...")
                
                if AUDIO_STORAGE.exists():
                    total_files = 0
                    wav_files = 0
                    mp3_files = 0
                    total_size = 0
                    wav_size = 0
                    mp3_size = 0

                    for item in AUDIO_STORAGE.rglob("*"):
                        if item.is_file():
                            total_files += 1
                            file_size = item.stat().st_size
                            total_size += file_size
                            
                            ext = item.suffix.lower()
                            if ext == '.wav':
                                wav_files += 1
                                wav_size += file_size
                            elif ext == '.mp3':
                                mp3_files += 1
                                mp3_size += file_size

                    disk_stats = await check_disk_space()

                    logger.info(
                        "=== DAILY STORAGE REPORT ===\n"
                        f"Disk usage: {disk_stats.get('used_gb', 0):.1f}GB / "
                        f"{disk_stats.get('total_gb', 0):.1f}GB "
                        f"({disk_stats.get('free_percent', 0):.1f}% free)\n"
                        f"Total files: {total_files}\n"
                        f"WAV files: {wav_files} ({wav_size/(1024**3):.1f}GB)\n"
                        f"MP3 files: {mp3_files} ({mp3_size/(1024**3):.1f}GB)\n"
                        f"Total audio size: {total_size/(1024**3):.1f}GB\n"
                        "==========================="
                    )
                else:
                    logger.warning(f"Storage directory does not exist: {AUDIO_STORAGE}")

                await asyncio.sleep(24 * 60 * 60)
                
            except asyncio.CancelledError:
                logger.info("Storage report task cancelled")
                break
            except Exception as e:
                logger.error(f"Storage report error: {str(e)}")
                await asyncio.sleep(3600)
    
    def start_all_tasks(self):
        if self.is_running:
            logger.warning("Background tasks are already running")
            return
        
        self.is_running = True

        self.tasks['token_cleanup'] = asyncio.create_task(
            self._run_token_cleanup(),
            name="token_cleanup_task"
        )
        
        self.tasks['sold_beats_cleanup'] = asyncio.create_task(
            self._run_sold_beats_cleanup(),
            name="sold_beats_cleanup_task"
        )
        
        self.tasks['disk_space_check'] = asyncio.create_task(
            self._run_disk_space_check(),
            name="disk_space_check_task"
        )
        
        self.tasks['storage_report'] = asyncio.create_task(
            self._run_storage_report(),
            name="storage_report_task"
        )
        self.tasks['promotion_check'] = asyncio.create_task(
            self._run_promotion_check(),
            name="promotion_check_task"
        )
        
        logger.info(
            "Background tasks started:\n"
            "  - Token cleanup: every 2 hours\n"
            "  - SOLD beats cleanup (WAV+MP3): every 24 hours\n"
            "  - Disk space check: every 6 hours\n"
            "  - Storage report: every 24 hours\n"
            "  - Check Promotions: every 1 hour"
        )
    
    async def stop_all_tasks(self):
        self.is_running = False
        
        logger.info("Stopping background tasks...")

        for task_name, task in self.tasks.items():
            if task and not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    logger.debug(f"Task '{task_name}' cancelled successfully")
                except Exception as e:
                    logger.error(f"Error stopping task '{task_name}': {str(e)}")
        
        self.tasks.clear()
        logger.info("All background tasks stopped")
    
    def shutdown(self):
        self.is_running = False
        for task_name, task in self.tasks.items():
            if task:
                task.cancel()
        logger.info("Background tasks shutdown initiated")

task_manager = BackgroundTaskManager()