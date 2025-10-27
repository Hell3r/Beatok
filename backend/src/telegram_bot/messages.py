from datetime import datetime

class MessageTemplates:
    @staticmethod
    def support_request(request_data: dict, user_info: dict) -> str:
        timestamp = datetime.now().strftime("%d.%m.%Y %H:%M")

        return f"""
🆕 <b>Новая заявка в поддержку</b>

👤 <b>Пользователь:</b>
   • ID: {user_info.get('id', 'N/A')}
   • Имя: {user_info.get('username', 'N/A')}
   • Email: {user_info.get('email', 'N/A')}

📋 <b>Информация о заявке:</b>
   • Тип проблемы: {request_data.get('problem_type', 'N/A')}
   • Заголовок: {request_data.get('title', 'N/A')}
   • Описание: {request_data.get('description', 'N/A')}

⏰ <b>Время создания:</b> {timestamp}
        """.strip()

    @staticmethod
    def beat_moderation_request(beat_data: dict, user_info: dict, pricings=None) -> str:
        timestamp = datetime.now().strftime("%d.%m.%Y %H:%M")

        pricing_text = ""
        if pricings:
            pricing_lines = []
            for pricing in pricings:
                tariff_name = pricing.tariff.display_name if pricing.tariff else pricing.tariff_name
                pricing_lines.append(f"   • {tariff_name}: {pricing.price} ₽")
            if pricing_lines:
                pricing_text = "\n💰 <b>Цены:</b>\n" + "\n".join(pricing_lines)
            else:
                pricing_text = "\n💰 <b>Цены:</b> Бесплатно"
        else:
            pricing_text = "\n💰 <b>Цены:</b> Не указаны"

        return f"""
🎵 <b>Новая заявка на модерацию бита</b>

👤 <b>Автор:</b>
   • ID: {user_info.get('id', 'N/A')}
   • Имя: {user_info.get('username', 'N/A')}
   • Email: {user_info.get('email', 'N/A')}

🎼 <b>Информация о бите:</b>
   • ID бита: {beat_data.get('id', 'N/A')}
   • Название: {beat_data.get('name', 'N/A')}
   • Жанр: {beat_data.get('genre', 'N/A')}
   • Темп: {beat_data.get('tempo', 'N/A')} BPM
   • Тональность: {beat_data.get('key', 'N/A')}
   • Статус продвижения: {beat_data.get('promotion_status', 'N/A')}{pricing_text}

⏰ <b>Время создания:</b> {timestamp}

<i>Используйте кнопки ниже для принятия решения по модерации.</i>
        """.strip()

    @staticmethod
    def welcome_message() -> str:
        return ""
