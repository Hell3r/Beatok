import os
from typing import Optional

class Settings():
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://185.55.59.6:6379")
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD")
    REDIS_DB: int = int(os.getenv("REDIS_DB", 0))
    REDIS_MAX_CONNECTIONS: int = int(os.getenv("REDIS_MAX_CONNECTIONS", 10))
    
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_STRICT: bool = False 

    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://beatokservice.ru")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "https://beatokservice.ru")
    

    ENCRYPTION_KEY: Optional[str] = os.getenv("ENCRYPTION_KEY")
    CACHE_TTL: int = 3600 
    CACHE_ENABLED: bool = True
    CACHE_PREFIX: str = "beatok"

    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.yandex.ru")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "465"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")

    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@185.55.59.6/beatok")

    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    TPAY_TERMINAL_KEY="TinkoffBankTest"
    TPAY_PASSWORD="TinkoffBankTest"
    
    S3_ENDPOINT: str = os.getenv("S3_ENDPOINT")
    S3_ACCESS_KEY: str = os.getenv("aws_access_key_id")
    S3_SECRET_KEY: str = os.getenv("aws_secret_access_key")
    S3_REGION: str = os.getenv("S3_REGION")
    
    
    
    class Config:
        env_file = ".env"

settings = Settings()