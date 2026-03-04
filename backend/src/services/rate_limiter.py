import time
import hashlib
from datetime import datetime
from fastapi import HTTPException, Request
from typing import Optional, Dict, Any
from src.services.RedisService import redis_service
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    # Лимиты для обычных пользователей
    LIMITS_STANDARD = {
        'api_global': (1000, 60),           # 1000 запросов в минуту
        'auth_login': (5, 60),              # 5 попыток входа в минуту
        'beat_create': (100, 300),          # 100 созданий битов за 5 минут
        'file_upload': (20, 3600),          # 20 загрузок в час
        'beat_download': (50, 3600),        # 50 скачиваний в час
        'beat_daily_limit': (5, 86400),     # 5 битов в сутки (24 часа) для обычных
    }
    
    # Лимиты для подписчиков
    LIMITS_SUBSCRIBER = {
        'api_global': (1000, 60),           # 1000 запросов в минуту
        'auth_login': (5, 60),              # 5 попыток входа в минуту
        'beat_create': (100, 300),          # 100 созданий битов за 5 минут
        'file_upload': (20, 3600),          # 20 загрузок в час
        'beat_download': (50, 3600),        # 50 скачиваний в час
        'beat_daily_limit': (15, 86400),    # 15 битов в сутки для подписчиков
    }
    
    def __init__(self):
        self.limits = self.LIMITS_STANDARD.copy()
    
    def get_limits_for_user(self, is_subscriber: bool) -> dict:
        """Возвращает лимиты в зависимости от статуса подписки"""
        return self.LIMITS_SUBSCRIBER.copy() if is_subscriber else self.LIMITS_STANDARD.copy()
    
    async def is_rate_limited(self, action: str, identifier: str) -> bool:
        """
        Проверяет, превышен ли rate limit для действия
        """
        if not await redis_service.is_connected():
            logger.warning("Redis не подключен, пропускаем rate limit")
            return False
            
        if action not in self.limits:
            logger.warning(f"Неизвестное действие для rate limit: {action}")
            return False
            
        max_requests, window_seconds = self.limits[action]
        key = f"rate_limit:{action}:{identifier}"
        
        current_time = int(time.time())
        window_start = current_time - window_seconds
        
        try:
            # Атомарная операция в Redis pipeline
            pipeline = redis_service.redis.pipeline()
            pipeline.zadd(key, {str(current_time): current_time})
            pipeline.zremrangebyscore(key, 0, window_start)
            pipeline.zcard(key)
            pipeline.expire(key, window_seconds)
            
            results = await pipeline.execute()
            request_count = results[2]
            
            if request_count >= max_requests:
                logger.warning(f"🚨 Rate limit exceeded: {action} for {identifier} ({request_count}/{max_requests})")
                return True
                
            logger.debug(f"✅ Rate limit OK: {action} for {identifier} ({request_count}/{max_requests})")
            return False
            
        except Exception as e:
            logger.error(f"Rate limit error for {action}: {e}")
            return False
    
    async def check_daily_beat_limit(self, user_id: int) -> Dict[str, Any]:
        if not await redis_service.is_connected():
            logger.warning("Redis не подключен, разрешаем создание")
            return {
                "can_create": True,
                "used": 0,
                "remaining": 3,
                "limit": 3,
                "resets_in": 0,
                "resets_at": "00:00",
                "user_message": "Лимиты временно отключены"
            }
        
        action = 'beat_daily_limit'
        identifier = f"user_{user_id}"
        key = f"rate_limit:{action}:{identifier}"
        
        max_requests, window_seconds = self.limits[action]
        current_time = int(time.time())
        window_start = current_time - window_seconds
        
        try:
            # Получаем текущее количество запросов за последние 24 часа
            pipeline = redis_service.redis.pipeline()
            pipeline.zremrangebyscore(key, 0, window_start)
            pipeline.zcard(key)
            
            results = await pipeline.execute()
            request_count = results[1] or 0
            
            # Вычисляем время до сброса
            time_in_window = current_time - window_start
            resets_in = window_seconds - time_in_window
            
            # Форматируем время сброса
            reset_time = time.strftime("%H:%M", time.localtime(current_time + resets_in))
            
            # Формируем понятное сообщение
            hours = resets_in // 3600
            minutes = (resets_in % 3600) // 60
            
            user_message = ""
            if request_count >= max_requests:
                user_message = (
                    f"Дневной лимит исчерпан!\n"
                    f"Вы загрузили {request_count}/{max_requests} битов за последние 24 часа.\n"
                )
            else:
                user_message = (
                    f"✅ Лимит: {request_count}/{max_requests} битов за 24 часа\n"
                    f"Осталось: {max_requests - request_count} битов\n"
                    f"Сброс в {reset_time}"
                )
            
            return {
                "can_create": request_count < max_requests,
                "used": request_count,
                "remaining": max(0, max_requests - request_count),
                "limit": max_requests,
                "resets_in": resets_in,
                "resets_at": reset_time,
                "hours_until_reset": hours,
                "minutes_until_reset": minutes,
                "user_message": user_message
            }
            
        except Exception as e:
            logger.error(f"Daily limit check error for user {user_id}: {e}")
            return {
                "can_create": True,
                "used": 0,
                "remaining": 3,
                "limit": 3,
                "resets_in": 0,
                "resets_at": "00:00",
                "user_message": "Ошибка проверки лимита"
            }
    
    async def increment_daily_beat_counter(self, user_id: int) -> int:
        if not await redis_service.is_connected():
            return 0
            
        action = 'beat_daily_limit'
        identifier = f"user_{user_id}"
        key = f"rate_limit:{action}:{identifier}"
        
        current_time = int(time.time())
        
        try:
            pipeline = redis_service.redis.pipeline()
            pipeline.zadd(key, {str(current_time): current_time})
            pipeline.zremrangebyscore(key, 0, current_time - 86400)  # удаляем старые (>24ч)
            pipeline.zcard(key)  # получаем новое количество
            pipeline.expire(key, 86400)  # TTL 24 часа
            
            results = await pipeline.execute()
            new_count = results[2] or 0
            
            logger.info(f"📊 Daily beat counter incremented for user {user_id}: {new_count}/3")
            return new_count
            
        except Exception as e:
            logger.error(f"Increment daily counter error for user {user_id}: {e}")
            return 0
    
    async def get_user_beat_stats(self, user_id: int) -> Dict[str, Any]:
        if not await redis_service.is_connected():
            return {"error": "Redis not connected"}
        
        stats = {}
        current_time = int(time.time())
        
        try:
            # За последние 24 часа
            daily_limit_info = await self.check_daily_beat_limit(user_id)
            stats["last_24h"] = daily_limit_info
            
            # За последние 7 дней (отдельные дни)
            week_stats = {}
            for i in range(7):
                day_start = current_time - (i * 86400)
                day_end = day_start + 86400
                
                action = 'beat_daily_limit'
                identifier = f"user_{user_id}"
                key = f"rate_limit:{action}:{identifier}"
                
                # Подсчитываем записи за конкретный день
                count = await redis_service.redis.zcount(key, day_start, day_end)
                date_str = time.strftime("%Y-%m-%d", time.localtime(day_start))
                week_stats[date_str] = count
            
            stats["last_7_days"] = week_stats
            
            action = 'beat_daily_limit'
            identifier = f"user_{user_id}"
            key = f"rate_limit:{action}:{identifier}"
            total_count = await redis_service.redis.zcard(key)
            
            stats["total_beats"] = total_count
            stats["user_id"] = user_id
            stats["timestamp"] = datetime.now().isoformat()
            
            return stats
            
        except Exception as e:
            logger.error(f"Get user stats error for user {user_id}: {e}")
            return {"error": str(e)}

def get_client_identifier(request: Request, user_id: int = None) -> str:
    client_ip = request.client.host if request.client else "0.0.0.0"
    
    if user_id:
        # Для аутентифицированных пользователей используем user_id
        return f"user_{user_id}"
    else:
        # Для неаутентифицированных - комбинация IP и User-Agent
        user_agent = request.headers.get("user-agent", "unknown")
        ip_agent_hash = hashlib.md5(f"{client_ip}_{user_agent}".encode()).hexdigest()[:16]
        return f"ip_{ip_agent_hash}"

async def check_rate_limit(request: Request, action: str, user_id: int = None, is_subscriber: bool = False):
    if is_subscriber:
        limits = RateLimiter.LIMITS_SUBSCRIBER
    else:
        limits = RateLimiter.LIMITS_STANDARD
    
    identifier = get_client_identifier(request, user_id)
    
    rate_limiter = RateLimiter()
    rate_limiter.limits = limits  # Устанавливаем нужные лимиты
    
    # ⭐ СПЕЦИАЛЬНАЯ ПРОВЕРКА ДЛЯ ДНЕВНОГО ЛИМИТА НА БИТЫ
    if action in ["beat_create", "beat_daily_limit"] and user_id:
        logger.info(f"🔍 Проверка дневного лимита для user_id={user_id}, подписчик={is_subscriber}")
        
        limit_for_user = limits['beat_daily_limit'][0]  # 5 или 15
        daily_limit_info = await rate_limiter.check_daily_beat_limit(user_id)
        
        # Переопределяем лимит в информации
        daily_limit_info['limit'] = limit_for_user
        daily_limit_info['remaining'] = max(0, limit_for_user - daily_limit_info['used'])
        
        if not daily_limit_info["can_create"]:
            logger.warning(f"🚨 Daily limit exceeded for user {user_id}: {daily_limit_info['used']}/{limit_for_user}")
            
            # Форматируем детали ошибки
            hours = daily_limit_info["resets_in"] // 3600
            minutes = (daily_limit_info["resets_in"] % 3600) // 60
            
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "daily_beat_limit_exceeded",
                    "message": "Дневной лимит битов исчерпан",
                    "limit": limit_for_user,
                    "used": daily_limit_info["used"],
                    "remaining": daily_limit_info["remaining"],
                    "is_subscriber": is_subscriber,
                    "resets_in_seconds": daily_limit_info["resets_in"],
                    "resets_in_human": f"{hours}ч {minutes}м",
                    "resets_at": daily_limit_info["resets_at"],
                    "user_message": daily_limit_info["user_message"],
                    "timestamp": datetime.now().isoformat()
                }
            )
        else:
            logger.info(f"✅ Daily limit OK for user {user_id}: {daily_limit_info['used']}/{limit_for_user}")
    
    if await rate_limiter.is_rate_limited(action, identifier):
        # Получаем информацию о лимите для сообщения
        max_requests, window_seconds = limits.get(action, (0, 60))
        
        # Определяем единицу времени
        if window_seconds < 60:
            time_unit = "секунд"
            time_value = window_seconds
        elif window_seconds < 3600:
            time_unit = "минут"
            time_value = window_seconds // 60
        else:
            time_unit = "часов"
            time_value = window_seconds // 3600
        
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limit_exceeded",
                "message": "Слишком много запросов. Попробуйте позже.",
                "action": action,
                "limit": max_requests,
                "window": f"{time_value} {time_unit}",
                "retry_after": 60,
                "identifier": identifier,
                "user_message": f"Слишком частые запросы. Максимум {max_requests} запросов за {time_value} {time_unit}."
            }
        )

rate_limiter = RateLimiter()