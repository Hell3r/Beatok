import zipfile
import io
import logging
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
import random
import re
from botocore.exceptions import ClientError

from src.core.s3_client import s3_client, S3_BUCKET

logger = logging.getLogger(__name__)

class ZipCreator:
    """Создание ZIP-архива с битом из S3 и документами."""

    @staticmethod
    def create_beat_zip(
        audio_key: str,
        beat_name: str,
        purchase_info: Dict[str, Any],
        downloads_left: int,
        expires_at: datetime,
        audio_format: Optional[str] = None
    ) -> io.BytesIO:
        """
        Скачивает аудиофайл из S3 по ключу и упаковывает в ZIP вместе с текстовыми файлами.
        Возвращает BytesIO с ZIP-архивом.
        """
        zip_buffer = io.BytesIO()

        # Определяем формат из ключа, если не передан
        if not audio_format:
            audio_format = audio_key.split('.')[-1].lower() if '.' in audio_key else 'wav'

        # Готовим имя файла внутри ZIP
        current_datetime = datetime.now().strftime("%Y-%m-%d")
        random_digits = ''.join(random.choice('0123456789') for _ in range(5))
        safe_filename = f"{random_digits}_{current_datetime}.{audio_format}"

        try:
            # Скачиваем файл из S3 в буфер
            audio_buffer = io.BytesIO()
            s3_client.download_fileobj(
                Bucket=S3_BUCKET,
                Key=audio_key,
                Fileobj=audio_buffer
            )
            audio_buffer.seek(0)

            # Создаём ZIP
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                # Добавляем аудиофайл
                zip_file.writestr(safe_filename, audio_buffer.getvalue())

                # Добавляем текстовые файлы
                info_content = ZipCreator._create_info_content(
                    beat_name, purchase_info, downloads_left, expires_at, audio_format
                )
                zip_file.writestr("ПРОЧТИ_МЕНЯ.txt", info_content.encode('utf-8'))

                license_content = ZipCreator._create_license_content(beat_name)
                zip_file.writestr("ЛИЦЕНЗИЯ.txt", license_content.encode('utf-8'))

                contacts_content = ZipCreator._create_contacts_content()
                zip_file.writestr("КОНТАКТЫ.txt", contacts_content.encode('utf-8'))

        except ClientError as e:
            logger.error(f"Ошибка при скачивании файла из S3: {e}")
            raise Exception(f"Не удалось загрузить аудиофайл: {e}")

        zip_buffer.seek(0)
        return zip_buffer

    @staticmethod
    def _safe_filename(name: str) -> str:
        safe = re.sub(r'[<>:"/\\|?*]', '_', name)
        safe = re.sub(r'\s+', ' ', safe).strip()
        if len(safe) > 100:
            safe = safe[:100]
        return safe

    @staticmethod
    def _create_info_content(
        beat_name: str,
        purchase_info: Dict[str, Any],
        downloads_left: int,
        expires_at: datetime,
        audio_format: str
    ) -> str:
        current_date = datetime.now().strftime('%d.%m.%Y %H:%M:%S')
        expires_date = expires_at.strftime('%d.%m.%Y %H:%M')
        return f"""BEATOK - ДЕТАЛИ ПОКУПКИ
{"=" * 50}

🎵 БИТ: {beat_name}

💰 ИНФОРМАЦИЯ О ПОКУПКЕ:
• ID покупки: #{purchase_info.get('purchase_id', 'N/A')}
• Тариф: {purchase_info.get('tariff_name', 'Standard')}
• Цена: {purchase_info.get('amount', 0)} руб.
• Дата покупки: {purchase_info.get('purchase_date', current_date)}

📥 СТАТУС СКАЧИВАНИЯ:
• Скачано: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}
• Осталось скачиваний: {downloads_left}
• Срок действия до: {expires_date}

🎧 ТЕХНИЧЕСКАЯ ИНФОРМАЦИЯ:
• Файл: {ZipCreator._safe_filename(beat_name)}.{audio_format}
• Формат: {audio_format.upper()}

{"=" * 50}
© Beatok {datetime.now().year}
    """

    @staticmethod
    def _create_license_content(beat_name: str) -> str:
        return f"""ЛИЦЕНЗИОННОЕ СОГЛАШЕНИЕ
{"=" * 50}

БИТ: {beat_name}
АВТОРСКИЕ ПРАВА: Beatok

1. ПРАВА НА ИСПОЛЬЗОВАНИЕ:
   ✓ Использование в личных музыкальных проектах
   ✓ Использование в некоммерческих релизах
   ✓ Редактирование и обработка для своих нужд

2. ТРЕБУЕТСЯ УКАЗАНИЕ АВТОРА:
   ✓ При публикации трека с использованием этого бита
   ✓ В описании трека на стриминговых платформах
   ✓ При коммерческом использовании

3. ЗАПРЕЩАЕТСЯ:
   ✗ Перепродажа или распространение файла
   ✗ Создание сэмплов для перепродажи
   ✗ Заявление авторских прав на оригинальный бит

4. ТЕХНИЧЕСКИЕ ДЕТАЛИ:
   • Файл предоставляется в формате WAV
   • Рекомендуется использовать в DAW (FL Studio, Ableton и т.д.)
   • Для стриминга конвертируйте в MP3 320kbps

5. ПОДДЕРЖКА:
   • Техническая поддержка: support@beatok.ru

{"=" * 50}
ДАННОЕ СОГЛАШЕНИЕ ДЕЙСТВИТЕЛЬНО С МОМЕНТА ПОКУПКИ
    """

    @staticmethod
    def _create_contacts_content() -> str:
        return f"""КОНТАКТЫ И ПОДДЕРЖКА
{"=" * 50}

📧 ЭЛЕКТРОННАЯ ПОЧТА:
• Поддержка пользователей: support@beatok.ru

🛠️ ТЕХНИЧЕСКАЯ ПОДДЕРЖКА:
• Рабочее время: Пн-Пт, 10:00-19:00 (МСК)
• Время ответа: до 24 часов

{"=" * 50}
© Beatok {datetime.now().year}
Все права защищены.
    """

    @staticmethod
    def get_zip_filename(beat_name: str) -> str:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        safe_name = ZipCreator._safe_filename(beat_name)
        return f"beatok_{safe_name}_{timestamp}.zip"