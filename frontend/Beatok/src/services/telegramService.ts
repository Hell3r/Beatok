import type { SupportRequest } from './requestService';

export interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: 'HTML' | 'Markdown';
}

class TelegramService {
  private botToken: string;
  private adminChatIds: string[];

  constructor() {
    this.botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
    this.adminChatIds = (import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_IDS || '').split(',');
  }

  async sendSupportRequestNotification(requestData: SupportRequest, userInfo: any): Promise<void> {
    if (!this.botToken || this.adminChatIds.length === 0) {
      console.warn('Telegram credentials not configured');
      return;
    }

    const message = this.formatSupportRequestMessage(requestData, userInfo);

    const sendPromises = this.adminChatIds.map(chatId => 
      this.sendMessage({
        chatId: chatId.trim(),
        text: message,
        parseMode: 'HTML'
      })
    );

    await Promise.all(sendPromises);
  }

  private formatSupportRequestMessage(requestData: SupportRequest, userInfo: any): string {
    const timestamp = new Date().toLocaleString('ru-RU');
    
    return `
🆕 <b>Новая заявка в поддержку</b>

👤 <b>Пользователь:</b> 
   • ID: ${userInfo.id}
   • Имя: ${userInfo.username}
   • Email: ${userInfo.email}

📋 <b>Информация о заявке:</b>
   • Тип проблемы: ${requestData.problem_type}
   • Заголовок: ${requestData.title}
   • Описание: ${requestData.description}

⏰ <b>Время создания:</b> ${timestamp}
    `.trim();
  }

  private async sendMessage(message: TelegramMessage): Promise<void> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: message.chatId,
          text: message.text,
          parse_mode: message.parseMode
        })
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      throw error;
    }
  }
}

export const telegramService = new TelegramService();