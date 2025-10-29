from fastapi import APIRouter, Request
from src.services.RedisService import redis_service
from src.services.rate_limiter import rate_limiter, get_client_identifier
import time

router = APIRouter(prefix = "/admin/rate", tags = ["Лимит запросов"])

@router.get("/rate-limit-status", summary= "Проверка текущих лимитов")
async def get_rate_limit_status(request: Request, user_id: int = None):
    identifier = get_client_identifier(request, user_id)
    
    status = {}
    for action, (max_requests, window_seconds) in rate_limiter.limits.items():
        key = f"rate_limit:{action}:{identifier}"
        
        if await redis_service.is_connected():
            current_time = int(time.time())
            window_start = current_time - window_seconds
            
            await redis_service.redis.zremrangebyscore(key, 0, window_start)
            count = await redis_service.redis.zcard(key)
            ttl = await redis_service.redis.ttl(key)
        else:
            count = 0
            ttl = -1
            
        status[action] = {
            'current_requests': count,
            'limit': max_requests,
            'window_seconds': window_seconds,
            'remaining': max(0, max_requests - count),
            'ttl_seconds': ttl
        }
    
    return status

@router.delete("/reset-rate-limit", summary= "Сброс лимитов")
async def reset_rate_limit(
    request: Request,
    identifier: str,
    action: str = None
):
    if action:
        key = f"rate_limit:{action}:{identifier}"
        await redis_service.redis.delete(key)
        return {"message": f"Rate limit reset for {action}:{identifier}"}
    else:
        pattern = f"rate_limit:*:{identifier}"
        keys = await redis_service.redis.keys(pattern)
        if keys:
            await redis_service.redis.delete(*keys)
        return {"message": f"All rate limits reset for {identifier}", "deleted_keys": keys}






