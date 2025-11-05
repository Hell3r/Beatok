from yookassa import Configuration
from src.core.config import settings
import logging

logger = logging.getLogger(__name__)


def setup_yookassa():
    """Настройка SDK ЮКассы из общих настроек"""
    Configuration.account_id = settings.YOOKASSA_SHOP_ID
    Configuration.secret_key = settings.YOOKASSA_SECRET_KEY
    
    logger.info(f"Yookassa configured: shop_id={settings.YOOKASSA_SHOP_ID}, test_mode={settings.YOOKASSA_TEST_MODE}")
    
    return settings


yookassa_settings = setup_yookassa()