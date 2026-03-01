from telegram import Update
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes
from .config import TelegramConfig
from .messages import MessageTemplates
from src.services.RedisService import redis_service
from ..database.deps import SessionDep
from ..models.beats import BeatModel, StatusType
from sqlalchemy import select
import asyncio
from contextlib import asynccontextmanager

class TelegramBotHandlers:
    def __init__(self, session_factory):
        self.session_factory = session_factory
        self.pending_rejections = {}

    @asynccontextmanager
    async def get_session(self):
        async with self.session_factory() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise

    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text(
            "Привет! Я бот для модерации битов на платформе Beatok.\n"
            "Я буду отправлять уведомления о новых битах для модерации."
        )

    async def handle_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        await query.answer()

        callback_data = query.data

        if callback_data.startswith("approve_beat_"):
            beat_id = int(callback_data.split("_")[-1])
            await self._handle_beat_approval(beat_id, query)
        elif callback_data.startswith("reject_beat_"):
            beat_id = int(callback_data.split("_")[-1])
            await self._handle_beat_rejection(beat_id, query)

    async def _handle_beat_approval(self, beat_id: int, query):
        async with self.get_session() as session:
            try:
                from ..models.beat_pricing import BeatPricingModel
                from sqlalchemy import update

                result = await session.execute(
                    select(BeatModel).where(BeatModel.id == beat_id)
                )
                beat = result.scalar_one_or_none()

                if not beat:
                    await query.edit_message_text("Бит не найден.")
                    return

                if beat.status != StatusType.MODERATED:
                    await query.edit_message_text("Бит уже был обработан.")
                    return

                await session.execute(
                    update(BeatPricingModel)
                    .where(
                        BeatPricingModel.beat_id == beat_id,
                        BeatPricingModel.tariff_name.in_(['leasing', 'exclusive'])
                    )
                    .values(price=BeatPricingModel.price + 200)
                )

                beat.status = StatusType.AVAILABLE
                await session.commit()
                await redis_service.delete_pattern("*beats*")


                await query.edit_message_text(
                    f"✅ Бит '{beat.name}' (ID: {beat.id}) одобрен и опубликован."
                )
            except Exception as e:
                await session.rollback()
                await query.edit_message_text(f"Ошибка при одобрении бита: {str(e)}")
                print(f"Error approving beat {beat_id}: {e}")

    async def _handle_beat_rejection(self, beat_id: int, query):
        async with self.get_session() as session:
            try:
                result = await session.execute(
                    select(BeatModel).where(BeatModel.id == beat_id)
                )
                beat = result.scalar_one_or_none()

                if not beat:
                    await query.edit_message_text("Бит не найден.")
                    return

                if beat.status != StatusType.MODERATED:
                    await query.edit_message_text("Бит уже был обработан.")
                    return
                user_id = query.from_user.id
                self.pending_rejections[user_id] = beat_id

                await query.edit_message_text(
                    f"❌ Вы отклонили бит '{beat.name}' (ID: {beat.id}).\n\n"
                    f"📝 Пожалуйста, введите причину отклонения в следующем сообщении."
                )
            except Exception as e:
                await session.rollback()
                await query.edit_message_text(f"Ошибка при отклонении бита: {str(e)}")
                print(f"Error rejecting beat {beat_id}: {e}")

    async def handle_text_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        user_id = update.effective_user.id
        message_text = update.message.text

        if user_id in self.pending_rejections:
            beat_id = self.pending_rejections[user_id]
            del self.pending_rejections[user_id]

            async with self.get_session() as session:
                try:
                    result = await session.execute(
                        select(BeatModel).where(BeatModel.id == beat_id)
                    )
                    beat = result.scalar_one_or_none()

                    if not beat:
                        await update.message.reply_text("Бит не найден.")
                        return

                    if beat.status != StatusType.MODERATED:
                        await update.message.reply_text("Бит уже был обработан.")
                        return

                    beat.status = StatusType.DENIED
                    beat.rejection_reason = message_text
                    await session.commit()

                    await update.message.reply_text(
                        f"✅ Бит '{beat.name}' (ID: {beat.id}) отклонен.\n"
                        f"📝 Причина: {message_text}"
                    )
                except Exception as e:
                    await session.rollback()
                    await update.message.reply_text(f"Ошибка при сохранении причины отклонения: {str(e)}")
                    print(f"Error saving rejection reason for beat {beat_id}: {e}")
        else:
            await update.message.reply_text("Я не ожидаю причину отклонения. Используйте кнопки для модерации битов.")

def setup_bot_handlers(application: Application, session_factory):
    handlers = TelegramBotHandlers(session_factory)

    application.add_handler(CommandHandler("start", handlers.start_command))
    application.add_handler(CallbackQueryHandler(handlers.handle_callback))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handlers.handle_text_message))

    return application
