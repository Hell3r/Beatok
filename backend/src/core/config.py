import os
from typing import Optional

class Settings:   
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD")
    REDIS_DB: int = int(os.getenv("REDIS_DB", 0))
    REDIS_MAX_CONNECTIONS: int = int(os.getenv("REDIS_MAX_CONNECTIONS", 10))
    

    CACHE_TTL: int = 3600 
    CACHE_ENABLED: bool = True
    CACHE_PREFIX: str = "beatok"
    
    class Config:
        env_file = ".env"

settings = Settings()