import asyncio
from telegram.ext import Application
from .config import TelegramConfig
from .handlers import setup_bot_handlers
from ..database.database import new_async_session  

async def run_telegram_bot():
    if not TelegramConfig.is_configured():
        print("Telegram bot not configured - skipping bot startup")
        return

    try:
        application = Application.builder().token(TelegramConfig.BOT_TOKEN).build()

        
        application = setup_bot_handlers(application, new_async_session)

        print("Telegram bot starting...")
        
        await application.initialize()
        await application.start()
        await application.updater.start_polling(
            drop_pending_updates=True,
            allowed_updates=['message', 'callback_query']
        )
        
        print("Telegram bot started successfully")
        
        
        while True:
            await asyncio.sleep(3600)  
            
    except Exception as e:
        print(f"Failed to start telegram bot: {e}")
    finally:
        try:
            if 'application' in locals():
                await application.updater.stop()
                await application.stop()
                await application.shutdown()
        except Exception as e:
            print(f"Error during shutdown: {e}")

if __name__ == "__main__":
    
    asyncio.run(run_telegram_bot())