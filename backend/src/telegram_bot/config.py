import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

class TelegramConfig:
    BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

    ADMIN_CHAT_IDS: List[int] = [
        901726812, 791503720
    ]

    @classmethod
    def is_configured(cls) -> bool:
        return bool(cls.BOT_TOKEN and cls.ADMIN_CHAT_IDS)
