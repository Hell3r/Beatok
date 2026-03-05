import zipfile
import io
import logging
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
from dataclasses import dataclass
import random
import re
from botocore.exceptions import ClientError

from src.core.s3_client import s3_client, S3_BUCKET

logger = logging.getLogger(__name__)


@dataclass
class TermsOfUseData:
    """Data class for terms of use information."""
    recording_tracks: bool = False
    commercial_perfomance: bool = False
    rotation_on_the_radio: bool = False
    music_video_recording: bool = False
    release_of_copies: bool = False


class ZipCreator:
    """Создание ZIP-архива с битом из S3 и документами."""

    @staticmethod
    def create_beat_zip(
        audio_key: str,
        beat_name: str,
        purchase_info: Dict[str, Any],
        downloads_left: int,
        expires_at: datetime,
        audio_format: Optional[str] = None,
        terms_of_use: Optional[TermsOfUseData] = None
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


                contacts_content = ZipCreator._create_contacts_content()
                zip_file.writestr("КОНТАКТЫ.txt", contacts_content.encode('utf-8'))

                # Добавляем файл условий использования, если они есть
                if terms_of_use:
                    terms_content = ZipCreator._create_terms_of_use_content(beat_name, terms_of_use)
                    zip_file.writestr("УСЛОВИЯ_ИСПОЛЬЗОВАНИЯ.txt", terms_content.encode('utf-8'))

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
        return f"""БИТОК - ДЕТАЛИ ПОКУПКИ
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
© БИТОК {datetime.now().year}
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
© БИТОК {datetime.now().year}
Все права защищены.
    """

    @staticmethod
    def _create_terms_of_use_content(beat_name: str, terms_of_use: TermsOfUseData) -> str:
        """Создает текстовый контент с условиями использования бита."""
        
        terms_list = []
        
        if terms_of_use.recording_tracks:
            terms_list.append("  • Запись треков (вокал)")
        if terms_of_use.commercial_perfomance:
            terms_list.append("  • Коммерческое использование")
        if terms_of_use.rotation_on_the_radio:
            terms_list.append("  • Ротация на радио")
        if terms_of_use.music_video_recording:
            terms_list.append("  • Запись музыкального видео (MTV)")
        if terms_of_use.release_of_copies:
            terms_list.append("  • Выпуск тиража (CD, DVD и т.д.)")
        
        terms_str = "\n".join(terms_list) if terms_list else "  (Особые условия не указаны)"
        
        return f"""УСЛОВИЯ ИСПОЛЬЗОВАНИЯ БИТА
{"=" * 50}

🎵 Приобретенный бит: {beat_name}

📋 РАЗРЕШЁННЫЕ ВИДЫ ИСПОЛЬЗОВАНИЯ:

{terms_str}

{"=" * 50}

⚠️ ВАЖНОЕ ПРИМЕЧАНИЕ:
При публикации трека с использованием данного бита,
пожалуйста, укажите автора в описании трека.

По всем вопросам обращайтесь: support@beatok.ru

{"=" * 50}
© БИТОК {datetime.now().year}
    """

    @staticmethod
    def get_zip_filename(beat_name: str) -> str:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        safe_name = ZipCreator._safe_filename(beat_name)
        return f"beatok_{safe_name}_{timestamp}.zip"

