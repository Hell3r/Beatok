import time
import hashlib
from fastapi import HTTPException, Request
from src.services.RedisService import redis_service
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self):
        self.limits = {
            'api_global': (1000, 60),           # 1000 запросов в минуту
            'auth_login': (5, 60),              # 5 попыток входа в минуту
            'beat_create': (10, 300),           # 10 созданий битов за 5 минут
            'file_upload': (20, 3600),          # 20 загрузок в час
            'beat_download': (50, 3600),        # 50 скачиваний в час
        }
    
    async def is_rate_limited(self, action: str, identifier: str) -> bool:
        if not await redis_service.is_connected():
            return False
            
        if action not in self.limits:
            return False
            
        max_requests, window_seconds = self.limits[action]
        key = f"rate_limit:{action}:{identifier}"
        
        current_time = int(time.time())
        window_start = current_time - window_seconds
        
        try:
            pipeline = redis_service.redis.pipeline()
            pipeline.zadd(key, {str(current_time): current_time})
            pipeline.zremrangebyscore(key, 0, window_start)
            pipeline.zcard(key)
            pipeline.expire(key, window_seconds)
            
            results = await pipeline.execute()
            request_count = results[2]
            
            if request_count >= max_requests:
                logger.warning(f"🚨 Rate limit exceeded: {action} for {identifier}")
                return True
                
            return False
            
        except Exception as e:
            logger.error(f"Rate limit error: {e}")
            return False

def get_client_identifier(request: Request, user_id: int = None) -> str:
    client_ip = request.client.host
    
    if user_id:
        return f"user_{user_id}"
    else:
        user_agent = request.headers.get("user-agent", "unknown")
        ip_agent_hash = hashlib.md5(f"{client_ip}_{user_agent}".encode()).hexdigest()[:16]
        return f"ip_{ip_agent_hash}"

async def check_rate_limit(request: Request, action: str, user_id: int = None):
    identifier = get_client_identifier(request, user_id)
    
    rate_limiter = RateLimiter()
    if await rate_limiter.is_rate_limited(action, identifier):
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "message": "Слишком много запросов. Попробуйте позже.",
                "retry_after": 60
            }
        )

rate_limiter = RateLimiter()