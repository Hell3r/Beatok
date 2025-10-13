from .bot import support_bot

async def send_support_request_to_telegram(request_data: dict, user_info: dict):
    await support_bot.send_support_notification(request_data, user_info)