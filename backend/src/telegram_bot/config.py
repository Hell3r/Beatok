import os
from typing import List

class TelegramConfig:
    BOT_TOKEN = "8417404404:AAGk6xX_zoSiAT4OAWWMdn35mxXdoOw3408"

    ADMIN_CHAT_IDS: List[int] = [
        901726812, 791503720
    ]

    @classmethod
    def is_configured(cls) -> bool:
        return bool(cls.BOT_TOKEN and cls.ADMIN_CHAT_IDS)
