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
    def welcome_message() -> str:
        return None