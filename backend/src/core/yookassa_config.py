from yookassa import Configuration
from src.core.config import settings
import logging

logger = logging.getLogger(__name__)

def setup_yookassa():
    """Настройка SDK ЮKassa"""
    try:
        Configuration.account_id = settings.YOOKASSA_SHOP_ID
        Configuration.secret_key = settings.YOOKASSA_SECRET_KEY
        
        mode = "TEST" if settings.YOOKASSA_TEST_MODE else "PRODUCTION"
        logger.info(f"✅ Yookassa configured in {mode} mode")
        
        return True
    except Exception as e:
        logger.error(f"❌ Failed to setup Yookassa: {e}")
        return False

def validate_config():
    """Проверка конфигурации"""
    errors = []
    
    if not settings.YOOKASSA_SHOP_ID:
        errors.append("YOOKASSA_SHOP_ID is required")
    
    if not settings.YOOKASSA_SECRET_KEY:
        errors.append("YOOKASSA_SECRET_KEY is required")
    
    if not settings.YOOKASSA_TEST_MODE:
        if not settings.YOOKASSA_SECRET_KEY.startswith("live_"):
            errors.append("Production mode requires live_ secret key")
    else:
        if not settings.YOOKASSA_SECRET_KEY.startswith("test_"):
            logger.warning("Test mode but secret key doesn't start with 'test_'")
    
    if errors:
        for error in errors:
            logger.error(f"❌ {error}")
        return False
    
    logger.info("✅ Configuration validated")
    return True

# Автоматическая настройка при импорте
setup_yookassa()