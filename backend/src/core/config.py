import os
from typing import Optional

class Settings:   
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD")
    REDIS_DB: int = int(os.getenv("REDIS_DB", 0))
    REDIS_MAX_CONNECTIONS: int = int(os.getenv("REDIS_MAX_CONNECTIONS", 10))
    
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_STRICT: bool = False 
    
    
    
    
    YOOKASSA_SHOP_ID: str = os.getenv("YOOKASSA_SHOP_ID", "1197323")
    YOOKASSA_SECRET_KEY: str = os.getenv("YOOKASSA_SECRET_KEY", "test_lnMwnHr4zOjKcan7a4tEnHdBW6x66oVCFhLzHGCvC7A")
    YOOKASSA_WEBHOOK_SECRET: str = os.getenv("YOOKASSA_WEBHOOK_SECRET", "default_webhook_secret")
    YOOKASSA_TEST_MODE: bool = True
    
    YOOKASSA_RETURN_URL: str = os.getenv("YOOKASSA_RETURN_URL", "http://localhost:8000")
    YOOKASSA_PAYMENT_TIMEOUT: int = int(os.getenv("YOOKASSA_PAYMENT_TIMEOUT", 86400))
    
    
    
    CACHE_TTL: int = 3600 
    CACHE_ENABLED: bool = True
    CACHE_PREFIX: str = "beatok"
    
    class Config:
        env_file = ".env"

settings = Settings()