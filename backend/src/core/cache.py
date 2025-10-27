from functools import wraps
from typing import Optional, Any
import hashlib
import inspect
import logging
from src.services.RedisService import redis_service
from src.core.config import settings

logger = logging.getLogger(__name__)

def generate_cache_key(func, *args, **kwargs) -> str:
    func_name = func.__name__
    module = func.__module__
    
    filtered_kwargs = {}
    for key, value in kwargs.items():
        if isinstance(value, (str, int, float, bool, type(None))):
            filtered_kwargs[key] = value
    
    kwargs_repr = repr(sorted(filtered_kwargs.items()))
    
    signature_hash = hashlib.md5(kwargs_repr.encode()).hexdigest()[:12]
    
    return f"{module}:{func_name}:{signature_hash}"

def cached(ttl: int = 300):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            key = generate_cache_key(func, *args, **kwargs)
            
            cached_data = await redis_service.get(key)
            if cached_data is not None:
                logger.info(f"🎯 КЕШ НАЙДЕН: {key}")
                return cached_data
            
            result = await func(*args, **kwargs)
            
            await redis_service.set(key, result, ttl)
            logger.info(f"💾 КЕШ СОХРАНЕН: {key}")
            
            return result
        return wrapper
    return decorator