import asyncio
from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.error import TelegramError
from .config import TelegramConfig
from .messages import MessageTemplates

class SupportBot:
    def __init__(self):
        self.bot = Bot(token=TelegramConfig.BOT_TOKEN)
        self.admin_chat_ids = TelegramConfig.ADMIN_CHAT_IDS

    async def send_support_notification(self, request_data: dict, user_info: dict):
        if not TelegramConfig.is_configured():
            print("Telegram bot not configured - skipping notification")    
            return

        message = MessageTemplates.support_request(request_data, user_info)

        for chat_id in self.admin_chat_ids:
            try:
                await self.bot.send_message(
                    chat_id=chat_id,
                    text=message,
                    parse_mode='HTML'
                )
                print(f"Notification sent to admin {chat_id}")
            except TelegramError as e:
                print(f"Failed to send notification to {chat_id}: {e}")

    async def send_beat_moderation_notification(self, beat_data: dict, user_info: dict, audio_path: str = None):
        if not TelegramConfig.is_configured():
            print("Telegram bot not configured - skipping beat moderation notification")
            return

        pricings = []
        try:
            from ..database.database import new_async_session
            from ..models.beat_pricing import BeatPricingModel
            from sqlalchemy import select
            from sqlalchemy.orm import joinedload

            async with new_async_session() as session:
                result = await session.execute(
                    select(BeatPricingModel)
                    .options(joinedload(BeatPricingModel.tariff))
                    .where(BeatPricingModel.beat_id == beat_data['id'])
                )
                pricings = result.scalars().all()
        except Exception as e:
            print(f"Error fetching pricings for beat {beat_data['id']}: {e}")

        message = MessageTemplates.beat_moderation_request(beat_data, user_info, pricings)

        
        keyboard = [
            [
                InlineKeyboardButton("✅ Принять", callback_data=f"approve_beat_{beat_data['id']}"),
                InlineKeyboardButton("❌ Отклонить", callback_data=f"reject_beat_{beat_data['id']}")
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        for chat_id in self.admin_chat_ids:
            try:
                
                await self.bot.send_message(
                    chat_id=chat_id,
                    text=message,
                    parse_mode='HTML',
                    reply_markup=reply_markup
                )

                
                if audio_path:
                    try:
                        with open(audio_path, 'rb') as audio_file:
                            await self.bot.send_audio(
                                chat_id=chat_id,
                                audio=audio_file,
                                title=f"Бит: {beat_data['name']}",
                                performer=user_info.get('username', 'Unknown'),
                                write_timeout=120,
                                connect_timeout=10
                            )
                    except Exception as e:
                        print(f"Failed to send audio file to {chat_id}: {e}")

                print(f"Beat moderation notification sent to admin {chat_id}")
            except TelegramError as e:
                print(f"Failed to send beat moderation notification to {chat_id}: {e}")

    async def send_welcome_messages(self):
        if not TelegramConfig.is_configured():
            return

        for chat_id in self.admin_chat_ids:
            try:
                await self.bot.send_message(
                    chat_id=chat_id,
                    text=MessageTemplates.welcome_message()
                )
            except TelegramError as e:
                print(f"Failed to send welcome message to {chat_id}: {e}")

support_bot = SupportBot()
