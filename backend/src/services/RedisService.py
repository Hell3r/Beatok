import redis.asyncio as redis
import json
import logging
from typing import Optional, Any, Dict
from src.core.config import settings

logger = logging.getLogger(__name__)

class RedisService:
    def __init__(self):
        self.redis: Optional[redis.Redis] = None
        self._is_connected: bool = False
    
    async def connect(self) -> bool:
        if self._is_connected:
            return True
            
        try:
            self.redis = redis.Redis(
            host='localhost',
            port=6379,
            db=settings.REDIS_DB,
            decode_responses=True 
        )
            
            await self.redis.ping()
            self._is_connected = True
            logger.info("✅ Redis connected successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Redis connection failed: {e}")
            self.redis = None
            self._is_connected = False
            return False
    
    async def disconnect(self):
        if self.redis and self._is_connected:
            await self.redis.close()
            self._is_connected = False
            logger.info("🔌 Redis disconnected")
    
    async def is_connected(self) -> bool:
        if not self.redis or not self._is_connected:
            return False
        try:
            await self.redis.ping()
            return True
        except Exception:
            self._is_connected = False
            return False
    
    async def get(self, key: str) -> Optional[Any]:
        if not await self.is_connected() or not settings.CACHE_ENABLED:
            return None
        
        try:
            full_key = f"{settings.CACHE_PREFIX}:{key}"
            data = await self.redis.get(full_key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Redis get error for key {key}: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: int = None) -> bool:
        if not await self.is_connected() or not settings.CACHE_ENABLED:
            return False

        try:
            if ttl is None:
                ttl = settings.CACHE_TTL

            full_key = f"{settings.CACHE_PREFIX}:{key}"

            serialized_data = json.dumps(value, default=self._json_serializer)

            await self.redis.setex(full_key, ttl, serialized_data)
            return True
        except Exception as e:
            logger.error(f"Redis set error for key {key}: {e}")
            return False
    
    def _json_serializer(self, obj):
        if hasattr(obj, 'dict'):
            return obj.dict()
        elif hasattr(obj, 'isoformat'):
            return obj.isoformat()
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

    
    async def delete(self, key: str) -> bool:
        if not await self.is_connected():
            return False
        
        try:
            full_key = f"{settings.CACHE_PREFIX}:{key}"
            result = await self.redis.delete(full_key)
            return result > 0
        except Exception as e:
            logger.error(f"Redis delete error for key {key}: {e}")
            return False
    
    async def delete_pattern(self, pattern: str) -> bool:
        if not await self.is_connected():
            print("❌ Redis не подключен для удаления паттерна")
            return False
        
        try:
            full_pattern = f"{settings.CACHE_PREFIX}:{pattern}"
            print(f"🔍 Ищем ключи по паттерну: {full_pattern}")
            
            keys = await self.redis.keys(full_pattern)
            print(f"📋 Найдено ключей: {len(keys)}")
            
            if keys:
                await self.redis.delete(*keys)
                print(f"🗑️ Удалено {len(keys)} ключей: {keys}")
            else:
                print("⚠️ Ключи для удаления не найдены")
                
            return True
        except Exception as e:
            print(f"❌ Ошибка удаления паттерна {pattern}: {e}")
            return False
    
    async def flush_cache(self) -> bool:
        if not await self.is_connected():
            return False
        
        try:
            pattern = f"{settings.CACHE_PREFIX}:*"
            keys = await self.redis.keys(pattern)
            if keys:
                await self.redis.delete(*keys)
                logger.info(f"🧹 Flushed {len(keys)} cache keys")
            return True
        except Exception as e:
            logger.error(f"Redis flush error: {e}")
            return False
    
    async def get_stats(self) -> Dict[str, Any]:
        if not await self.is_connected():
            return {"status": "disconnected"}
        
        try:
            info = await self.redis.info()
            pattern = f"{settings.CACHE_PREFIX}:*"
            keys_count = len(await self.redis.keys(pattern))
            
            return {
                "status": "connected",
                "redis_version": info.get("redis_version"),
                "used_memory": info.get("used_memory_human"),
                "connected_clients": info.get("connected_clients"),
                "cache_keys_count": keys_count,
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}


redis_service = RedisService()