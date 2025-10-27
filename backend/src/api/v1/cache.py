from fastapi import APIRouter, HTTPException
from src.services.RedisService import redis_service

router = APIRouter(tags=["Кэш"])


@router.get("/cache/status", summary= "Статус Redis")
async def get_cache_status():
    stats = await redis_service.get_stats()
    return stats

@router.post("/cache/flush", summary= "Очистка всего кэша")
async def flush_cache():
    success = await redis_service.flush_cache()
    if success:
        return {"message": "Cache flushed successfully"}
    else:
        raise HTTPException(500, "Failed to flush cache")

@router.delete("/cache/keys/{pattern}", summary= "Очистка ключа")
async def delete_cache_pattern(pattern: str):
    success = await redis_service.delete_pattern(pattern)
    if success:
        return {"message": f"Cache keys with pattern '{pattern}' deleted"}
    else:
        raise HTTPException(500, "Failed to delete cache keys")

@router.get("/cache/keys", summary= "Получение списка ключей в кэше")
async def list_cache_keys(pattern: str = "*"):
    if not await redis_service.is_connected():
        return {"keys": [], "count": 0}
    
    try:
        from src.core.config import settings
        full_pattern = f"{settings.CACHE_PREFIX}:{pattern}"
        keys = await redis_service.redis.keys(full_pattern)
        return {
            "keys": keys,
            "count": len(keys)
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to list keys: {e}")

