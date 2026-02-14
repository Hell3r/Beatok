import os
from typing import Optional

class Settings():
    # === Redis ===
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD")
    REDIS_DB: int = int(os.getenv("REDIS_DB", 0))
    REDIS_MAX_CONNECTIONS: int = int(os.getenv("REDIS_MAX_CONNECTIONS", 10))
    
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_STRICT: bool = False 
    
    # === URL фронтенда ===
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    
    
    # === Безопасность ===
    ENCRYPTION_KEY: Optional[str] = os.getenv("ENCRYPTION_KEY")  # Для шифрования карт
    
    # === Cache ===
    CACHE_TTL: int = 3600 
    CACHE_ENABLED: bool = True
    CACHE_PREFIX: str = "beatok"
    
    # === Email ===
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.yandex.ru")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "465"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    
    # === Database ===
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost/beatok")
    
    # === Приложение ===
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    TPAY_TERMINAL_KEY="TinkoffBankTest"
    TPAY_PASSWORD="TinkoffBankTest"
    
    class Config:
        env_file = ".env"

settings = Settings()