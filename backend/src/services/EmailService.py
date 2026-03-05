import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
import os
import logging
import asyncio
from jinja2 import Template
from datetime import datetime, date, timedelta 

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self._initialized = False
        self.smtp_host = None
        self.smtp_port = None
        self.smtp_username = None
        self.smtp_password = None
        self.from_email = None
        self.from_name = None
        self.app_name = None
        self.base_url = None
    
    def _initialize(self):
        if self._initialized:
            return
            
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.mail.ru")
        self.smtp_port = int(os.getenv("SMTP_PORT"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("FROM_EMAIL")
        self.from_name = os.getenv("FROM_NAME")
        self.app_name = os.getenv("APP_NAME")
        self.base_url = os.getenv("BASE_URL")
        
        self._initialized = True
        
        if self.smtp_username and self.smtp_password:
            logger.info(f"✅ Email service initialized for {self.smtp_username}")
        else:
            logger.warning("⚠️ Email service: SMTP credentials not configured")
    
    async def send_verification_email(self, email: str, token: str, username: str) -> bool:
        self._initialize()

        if not self.base_url:
            logger.error("BASE_URL not configured")
            return False

        if not self.base_url.startswith(('http://', 'https://')):
            self.base_url = f"http://{self.base_url}"
            logger.warning(f"BASE_URL updated to include protocol: {self.base_url}")

        if not all([self.smtp_username, self.smtp_password]):
            logger.warning(f"Verification URL: {self.base_url}/v1/users/auth/verify-email?token={token}")
            return True

        verification_url = f"{self.base_url}/v1/users/auth/verify-email?token={token}"

        print(verification_url)
        
        logger.info(f"Sending verification email to {email}")
        
        subject = f"Подтверждение регистрации в БИТОК"
        
        html_content = self._render_verification_template(
            username=username,
            verification_url=verification_url,
            app_name=self.app_name
        )
        
        for attempt in range(3):
            try:
                success = await self._send_email(
                    to_email=email,
                    subject=subject,
                    html_content=html_content
                )
                
                if success:
                    logger.info(f"Verification email successfully sent to {email}")
                    return True
                    
            except Exception as e:
                logger.error(f"Error sending email to {email} (attempt {attempt + 1}): {str(e)}")
            
            if attempt < 2:
                await asyncio.sleep(5)
        
        logger.error(f"All attempts failed to send email to {email}")
        return False

    async def send_password_reset_email(self, email: str, token: str, username: str) -> bool:
        self._initialize()

        if not self.base_url:
            logger.error("BASE_URL not configured")
            return False

        if not self.base_url.startswith(('http://', 'https://')):
            self.base_url = f"http://{self.base_url}"
            logger.warning(f"BASE_URL updated to include protocol: {self.base_url}")

        if not all([self.smtp_username, self.smtp_password]):
            logger.warning(f"Password reset URL: {self.base_url}/reset-password?token={token}")
            return True

        reset_url = f"http://127.0.0.1:5173/reset-password?token={token}"

        logger.info(f"Sending password reset email to {email}")

        subject = f"Восстановление пароля в БИТОК"

        html_content = self._render_password_reset_template(
            username=username,
            reset_url=reset_url,
            app_name=self.app_name
        )

        for attempt in range(3):
            try:
                success = await self._send_email(
                    to_email=email,
                    subject=subject,
                    html_content=html_content
                )

                if success:
                    logger.info(f"Password reset email successfully sent to {email}")
                    return True

            except Exception as e:
                logger.error(f"Error sending password reset email to {email} (attempt {attempt + 1}): {str(e)}")

            if attempt < 2:
                await asyncio.sleep(5)

        logger.error(f"All attempts failed to send password reset email to {email}")
        return False

    async def _send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        try:
            message = MIMEMultipart("alternative")
            message["From"] = formataddr((self.from_name, self.from_email))
            message["To"] = to_email
            message["Subject"] = subject
            
            text_content = self._html_to_text(html_content)
            text_part = MIMEText(text_content, "plain", "utf-8")
            message.attach(text_part)

            html_part = MIMEText(html_content, "html", "utf-8")
            html_part.replace_header('Content-Type', 'text/html; charset=utf-8')
            message.attach(html_part)
            
            import ssl
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE

            if self.smtp_port == 465:
                smtp = aiosmtplib.SMTP(
                    hostname=self.smtp_host,
                    port=self.smtp_port,
                    use_tls=True,
                    tls_context=context
                )
            else:
                smtp = aiosmtplib.SMTP(
                    hostname=self.smtp_host,
                    port=self.smtp_port,
                    use_tls=False,
                    start_tls=True,
                    tls_context=context
                )
            await smtp.connect()
            
            await smtp.login(self.smtp_username, self.smtp_password)
            
            await smtp.send_message(message)
            
            await smtp.quit()
            
            return True
            
        except Exception as e:
            logger.error(f"SMTP error: {str(e)}", exc_info=True)
            return False
        
        
        
    async def send_beat_download_link(
        self,
        to_email: str,
        username: str,
        beat_name: str,
        confirm_url: str,
        direct_download_url: str,
        purchase_details: dict,
        expires_in_hours: int = 72
        ) -> bool:
        
        self._initialize()
        if not all([self.smtp_username, self.smtp_password]):
            logger.warning("SMTP не настроен, не могу отправить письмо")
            return False
        
        subject = f"🎵 Ссылка на скачивание бита '{beat_name}' | БИТОК"
        
        html_content = self._render_download_link_template(
            username=username,
            beat_name=beat_name,
            confirm_url=confirm_url,
            direct_download_url=direct_download_url,
            purchase_details=purchase_details,
            expires_in_hours=expires_in_hours,
            app_name=self.app_name
        )
        
        try:
            message = MIMEMultipart("alternative")
            message["From"] = formataddr((self.from_name, self.from_email))
            message["To"] = to_email
            message["Subject"] = subject
            
            text_content = f"""
            Здравствуйте, {username}!
            
            Спасибо за покупку на БИТОК!
            
            🎧 Детали покупки:
            • Бит: {beat_name}
            • Тариф: {purchase_details.get('tariff_name', 'Standard')}
            • Цена: {purchase_details.get('price', 0)} руб.
            • ID покупки: {purchase_details.get('purchase_id', 'N/A')}
            
            📥 Скачать бит:
            {direct_download_url}
            
            ⚠️ Важно:
            • Ссылка действительна {expires_in_hours} часов
            • Максимум 5 скачиваний
            • Не передавайте ссылку другим
            
            Спасибо, что выбрали БИТОК!
            """
            
            message.attach(MIMEText(text_content, "plain", "utf-8"))
            message.attach(MIMEText(html_content, "html", "utf-8"))
            
            import ssl
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            
            if self.smtp_port == 465:
                smtp = aiosmtplib.SMTP(
                    hostname=self.smtp_host,
                    port=self.smtp_port,
                    use_tls=True,
                    tls_context=context
                )
            else:
                smtp = aiosmtplib.SMTP(
                    hostname=self.smtp_host,
                    port=self.smtp_port,
                    use_tls=False,
                    start_tls=True,
                    tls_context=context
                )
            
            await smtp.connect()
            await smtp.login(self.smtp_username, self.smtp_password)
            await smtp.send_message(message)
            await smtp.quit()
            
            logger.info(f"✅ Ссылка на скачивание отправлена на {to_email}")
            return True
        
        except Exception as e:
            logger.error(f"Ошибка отправки ссылки: {e}")
            return False
            
            logger.info(f"✅ Ссылка на скачивание отправлена на {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Ошибка отправки ссылки: {e}")
            return False
    
    def _html_to_text(self, html_content: str) -> str:
        import re
        text = re.sub(r'<[^>]+>', '', html_content)
        text = re.sub(r'\n\s*\n', '\n\n', text)
        return text.strip()
    
    def _render_verification_template(self, username: str, verification_url: str, app_name: str) -> str:
        template_str = """<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
        <html>
        <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        </head>
        <body style="margin:0; padding:20px; background:#f6f6f6; font-family:Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#333333" border="0" style="max-width:600px; margin:0 auto; font-family: Arial, sans-serif; border-radius: 10px; border-collapse: separate; border-spacing: 0;">
        <tr>
            <td style="padding:30px; text-align:center; background:#222222; border-top-left-radius: 10px; border-top-right-radius: 10px;">
                <span style="color:#ffffff; display: inline; font-size:24px; font-weight:bold;">BEAT</span>
                <span style="color:#dc2626; display: inline; font-size:24px; font-weight:bold;">OK</span>
            </td>
        </tr>
        <tr>
            <td style="padding:30px; color:#ffffff; font-size:16px; margin:0;">
                Здравствуйте, {{ username }}!
            </td>
        </tr>
        <tr>
            <td style="padding:0 30px 20px 30px; color:#ffffff; font-size:14px;">
                Для подтверждения регистрации нажмите на кнопку:
            </td>
        </tr>
        <tr>
            <td style="padding:0 30px 20px 30px; text-align:center;">
                <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                    <td bgcolor="#dc2626" style="border-radius:4px; text-align:center;">
                        <a href="{{ verification_url }}" style="display:inline-block; padding:12px 30px; color:#ffffff; text-decoration:none; font-size:16px; font-weight:bold;">Подтвердить Email</a>
                    </td>
                </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding:0 30px 10px 30px; color:#ffffff; font-size:14px;">
                Или скопируйте ссылку в браузер:
            </td>
        </tr>
        <tr>
            <td style="padding:20px 30px 20px 30px; color:#ffffff; font-size:12px; border:none; word-break:break-word;">
                <a href="{{ verification_url }}" style="text-decoration:none; outline:none; color:#ffffff;">{{ verification_url }}</a>
            </td>
        </tr>
        <tr>
            <td style="padding:10px 30px 20px 30px; color:#cccccc; font-size:12px;">
                Ссылка действительна 2 часа
            </td>
        </tr>
        <tr>
            <td style="padding:20px; text-align:center; background:#333333; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
                <p style="color:#999999; font-size:12px; margin:0;">БИТОК &copy; 2025</p>
            </td>
        </tr>
        </table>
        </body>
        </html>"""
        
        template = Template(template_str)
        return template.render(
            username=username,
            verification_url=verification_url,
            app_name=app_name
        )

    def _render_password_reset_template(self, username: str, reset_url: str, app_name: str) -> str:
        template_str = """<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
        <html>
        <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        </head>
        <body style="margin:0; padding:20px; background:#f6f6f6; font-family:Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#333333" border="0" style="max-width:600px; margin:0 auto; font-family: Arial, sans-serif; border-radius: 10px; border-collapse: separate; border-spacing: 0;">
        <tr>
            <td style="padding:30px; text-align:center; background:#222222; border-top-left-radius: 10px; border-top-right-radius: 10px;">
                <span style="color:#ffffff; display: inline; font-size:24px; font-weight:bold;">BEAT</span>
                <span style="color:#dc2626; display: inline; font-size:24px; font-weight:bold;">OK</span>
            </td>
        </tr>
        <tr>
            <td style="padding:30px; color:#ffffff; font-size:16px; margin:0;">
                Здравствуйте, {{ username }}!
            </td>
        </tr>
        <tr>
            <td style="padding:0 30px 20px 30px; color:#ffffff; font-size:14px;">
                Вы запросили восстановление пароля. Для сброса пароля нажмите на кнопку:
            </td>
        </tr>
        <tr>
            <td style="padding:0 30px 20px 30px; text-align:center;">
                <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                    <td bgcolor="#dc2626" style="border-radius:4px; text-align:center;">
                        <a href="{{ reset_url }}" style="display:inline-block; padding:12px 30px; color:#ffffff; text-decoration:none; font-size:16px; font-weight:bold;">Сбросить пароль</a>
                    </td>
                </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding:0 30px 10px 30px; color:#ffffff; font-size:14px;">
                Или скопируйте ссылку в браузер:
            </td>
        </tr>
        <tr>
            <td style="padding:20px 30px 20px 30px; color:#ffffff; font-size:12px; border:none; word-break:break-word;">
                <a href="{{ reset_url }}" style="text-decoration:none; outline:none; color:#ffffff;">{{ reset_url }}</a>
            </td>
        </tr>
        <tr>
            <td style="padding:10px 30px 20px 30px; color:#cccccc; font-size:12px;">
                Ссылка действительна 1 час
            </td>
        </tr>
        <tr>
            <td style="padding:20px; text-align:center; background:#333333; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
                <p style="color:#999999; font-size:12px; margin:0;">БИТОК &copy; 2025</p>
            </td>
        </tr>
        </table>
        </body>
        </html>"""

        template = Template(template_str)
        return template.render(
            username=username,
            reset_url=reset_url,
            app_name=app_name
        )
        
    def _render_download_link_template(
        self,
        username: str,
        beat_name: str,
        confirm_url: str,
        direct_download_url: str,
        purchase_details: dict,
        expires_in_hours: int,
        app_name: str
        ) -> str:
        template_str = '''<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Ваш бит готов к скачиванию</title>
        <style type="text/css">
            body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }

            body { font-family: Arial, sans-serif; color: white; background-color: #0a0a0a; }
            .container { max-width: 600px; margin: 0 auto; }

            .header { background-color: #0a0a0a; padding: 25px 0; text-align: center; }
            .logo { color: #ffffff; font-size: 32px; font-weight: bold; text-decoration: none; margin-bottom: 30px; }
            .logo-red { color: #dc2626; }

            .content { background-color: #0a0a0a; padding: 40px 30px; }
            .title { color: white; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center; }
            .greeting { color: #e5e5e5; font-size: 16px; line-height: 1.6; margin-bottom: 25px; text-align: center; }

            .beat-name {
                font-size: 24px;
                color: white;
                margin: 20px 0;
                padding: 15px;
                background: #1a1a1a;
                border-radius: 10px;
                border-left: 4px solid #dc2626;
                text-align: center;
            }

            .info-table { width: 100%; background: #1a1a1a; border-radius: 10px; margin: 25px 0; border-collapse: collapse; }
            .info-table td { padding: 15px 20px; border-bottom: 1px solid #333; }
            .info-table .label { color: #e5e5e5; font-weight: bold; width: 40%; background-color: #1a1a1a; }
            .info-table .value { color: white; }
            .info-table tr:last-child td { border-bottom: none; }

            .download-box { background-color: #1a1a1a; border: 2px dashed #dc2626; border-radius: 10px; padding: 25px; text-align: center; margin: 30px 0; }
            .download-title { color: white; font-size: 20px; font-weight: bold; margin-bottom: 15px; }
            .download-button { display: inline-block; background-color: #dc2626; color: white !important; text-decoration: none;
                            padding: 14px 35px; border-radius: 6px; font-size: 16px; font-weight: bold; margin: 15px 0; border: none; }
            .download-url { color: #e5e5e5; word-break: break-all; font-size: 14px; margin-top: 15px; }

            .instructions { background-color: #1a1a1a; border-left: 4px solid #dc2626; padding: 20px; margin: 25px 0; color: #e5e5e5; text-align: center; }
            .instructions-title { color: white; font-weight: bold; margin-bottom: 10px; }
            .instructions-list { color: #e5e5e5; margin: 0; padding-left: 20px; text-align: left; }
            .instructions-list li { margin-bottom: 8px; }

            .footer { background-color: #0a0a0a; color: #e5e5e5; padding: 25px; text-align: center; font-size: 12px; }
            .footer a { color: #cccccc; text-decoration: none; }
            .footer-links { margin-bottom: 15px; }
            .footer-links a { margin: 0 10px; }
            .copyright { margin-top: 15px; }

            @media only screen and (max-width: 600px) {
                .content { padding: 25px 15px; }
                .info-table td { padding: 10px 15px; display: block; width: 100%; }
                .info-table .label { border-bottom: none; padding-bottom: 5px; }
                .download-box { padding: 20px 15px; }
                .download-button { display: block; }
            }
        </style>
    </head>
    <body>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0a0a">
            <tr>
                <td align="center">
                    <table class="container" width="600" cellpadding="0" cellspacing="0" border="0">
                        <!-- Header -->
                        <tr>
                            <td class="header">
                                <div class="logo">BEAT<span class="logo-red">OK</span></div>
                            </td>
                        </tr>

                        <tr>
                            <td class="content">
                                <h1 class="title">Ваш приобретенный бит!</h1>

                                <div class="beat-name">
                                    {{ beat_name }}
                                </div>

                                <table class="info-table">
                                    <tr>
                                        <td class="label">📦 Формат:</td>
                                        <td class="value">ZIP архив с WAV файлом</td>
                                    </tr>
                                    <tr>
                                        <td class="label">⏱️ Скачивание начнется через:</td>
                                        <td class="value">{{ expires_in_hours }} часов</td>
                                    </tr>
                                    <tr>
                                        <td class="label">📥 Осталось скачиваний:</td>
                                        <td class="value">5</td>
                                    </tr>
                                    <tr>
                                        <td class="label">⏳ Срок действия:</td>
                                        <td class="value">до истечения срока</td>
                                    </tr>
                                </table>

                                <div class="download-box">
                                    <div class="download-title">Скачать бит</div>
                                    <a href="{{ confirm_url }}" class="download-button">СКАЧАТЬ ⬇</a>
                                    <div class="download-url">
                                        Альтернативная ссылка:<br>
                                        <a href="{{ direct_download_url }}">{{ direct_download_url }}</a>
                                    </div>
                                </div>

                                <div class="instructions">
                                    <div class="instructions-title">Если файл не скачивается:</div>
                                    <ul class="instructions-list">
                                        <li>Нажмите правой кнопкой на кнопку "СКАЧАТЬ"</li>
                                        <li>Выберите "Сохранить ссылку как..."</li>
                                        <li>Сохраните файл на компьютер</li>
                                    </ul>
                                    <p style="margin-top: 15px; font-size: 12px;">
                                        БИТОК © {{ current_year }}
                                    </p>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td class="footer">
                                <div class="copyright">
                                    © {{ current_year }} БИТОК. Все права защищены.
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>'''
        
        from jinja2 import Template
        template = Template(template_str)
        return template.render(
            username=username,
            beat_name=beat_name,
            confirm_url=confirm_url,
            direct_download_url = direct_download_url,
            purchase_details=purchase_details,
            expires_in_hours=expires_in_hours,
            app_name=app_name,
            base_url=self.base_url,
            current_year=datetime.now().year
        )
        
        
        
        
    async def test_connection(self) -> dict:
        self._initialize()
        
        if not all([self.smtp_username, self.smtp_password]):
            return {
                "success": False,
                "error": "SMTP credentials not configured",
                "details": "Set SMTP_USERNAME and SMTP_PASSWORD in .env file"
            }
            
        try:
            smtp = aiosmtplib.SMTP(
                hostname=self.smtp_host,
                port=self.smtp_port
            )
            
            await smtp.connect()
            
            await smtp.login(self.smtp_username, self.smtp_password)
            
            await smtp.quit()
            
            return {
                "success": True,
                "message": "SMTP connection successful",
                "host": self.smtp_host,
                "port": self.smtp_port
            }
            
        except aiosmtplib.SMTPAuthenticationError as e:
            return {
                "success": False,
                "error": "Authentication failed",
                "details": "Invalid username or password",
                "smtp_error": str(e)
            }
        except aiosmtplib.SMTPConnectError as e:
            return {
                "success": False,
                "error": "Connection failed",
                "details": f"Cannot connect to {self.smtp_host}:{self.smtp_port}",
                "smtp_error": str(e)
            }
        except Exception as e:
            return {
                "success": False,
                "error": "Connection failed",
                "details": str(e)
            }

    async def send_request_response_email(
        self,
        to_email: str,
        username: str,
        request_title: str,
        request_description: str,
        response_text: str,
        problem_type: str
    ) -> bool:
        self._initialize()
        
        if not all([self.smtp_username, self.smtp_password]):
            logger.warning("SMTP не настроен, не могу отправить письмо")
            return False
        
        subject = f"Ответ на вашу заявку '{request_title}' | БИТОК"
        
        html_content = self._render_request_response_template(
            username=username,
            request_title=request_title,
            request_description=request_description,
            response_text=response_text,
            problem_type=problem_type,
            app_name=self.app_name
        )
        
        try:
            message = MIMEMultipart("alternative")
            message["From"] = formataddr((self.from_name, self.from_email))
            message["To"] = to_email
            message["Subject"] = subject
            
            text_content = f"""
Здствуйте, {username}!

На вашу заявку в поддержку БИТОК поступил ответ:

📋 Детали заявки:
• Заголовок: {request_title}
• Тип проблемы: {problem_type}
• Описание: {request_description}

📝 Ответ службы поддержки:
{response_text}

---
С уважением,
Служба поддержки БИТОК
"""
            
            message.attach(MIMEText(text_content, "plain", "utf-8"))
            message.attach(MIMEText(html_content, "html", "utf-8"))
            
            import ssl
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            
            if self.smtp_port == 465:
                smtp = aiosmtplib.SMTP(
                    hostname=self.smtp_host,
                    port=self.smtp_port,
                    use_tls=True,
                    tls_context=context
                )
            else:
                smtp = aiosmtplib.SMTP(
                    hostname=self.smtp_host,
                    port=self.smtp_port,
                    use_tls=False,
                    start_tls=True,
                    tls_context=context
                )
            
            await smtp.connect()
            await smtp.login(self.smtp_username, self.smtp_password)
            await smtp.send_message(message)
            await smtp.quit()
            
            logger.info(f"✅ Ответ на заявку отправлен на {to_email}")
            return True
        
        except Exception as e:
            logger.error(f"Ошибка отправки ответа на заявку: {e}")
            return False
    
    def _render_request_response_template(
        self,
        username: str,
        request_title: str,
        request_description: str,
        response_text: str,
        problem_type: str,
        app_name: str
    ) -> str:
        template_str = '''<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Ответ на вашу заявку</title>
    <style type="text/css">
        body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }

        body { font-family: Arial, sans-serif; color: white; background-color: #0a0a0a; }
        .container { max-width: 600px; margin: 0 auto; }

        .header { background-color: #0a0a0a; padding: 25px 0; text-align: center; }
        .logo { color: #ffffff; font-size: 32px; font-weight: bold; text-decoration: none; margin-bottom: 30px; }
        .logo-red { color: #dc2626; }

        .content { background-color: #0a0a0a; padding: 40px 30px; }
        .greeting { color: #e5e5e5; font-size: 16px; line-height: 1.6; margin-bottom: 25px; text-align: center; }

        .request-box { background: #1a1a1a; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626; }
        .request-title { color: white; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .request-label { color: #e5e5e5; font-size: 14px; margin-bottom: 5px; }
        .request-value { color: white; font-size: 14px; margin-bottom: 15px; }

        .response-box { background: #1a1a1a; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #22c55e; }
        .response-title { color: #22c55e; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .response-text { color: white; font-size: 14px; line-height: 1.6; }

        .footer { background-color: #0a0a0a; color: #e5e5e5; padding: 25px; text-align: center; font-size: 12px; }
        .footer a { color: #cccccc; text-decoration: none; }
        .copyright { margin-top: 15px; }

        @media only screen and (max-width: 600px) {
            .content { padding: 25px 15px; }
        }
    </style>
</head>
<body>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0a0a">
        <tr>
            <td align="center">
                <table class="container" width="600" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td class="header">
                            <div class="logo">BEAT<span class="logo-red">OK</span></div>
                        </td>
                    </tr>

                    <tr>
                        <td class="content">
                            <h1 class="greeting">Здравствуйте, {{ username }}!</h1>
                            <p class="greeting">На вашу заявку в службу поддержки поступил ответ:</p>

                            <div class="request-box">
                                <div class="request-title">{{ request_title }}</div>
                                <div class="request-label">Тип проблемы:</div>
                                <div class="request-value">{{ problem_type }}</div>
                                <div class="request-label">Описание:</div>
                                <div class="request-value">{{ request_description }}</div>
                            </div>

                            <div class="response-box">
                                <div class="response-title">📝 Ответ службы поддержки</div>
                                <div class="response-text">{{ response_text }}</div>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td class="footer">
                            <div class="copyright">
                                © {{ current_year }} БИТОК. Все права защищены.
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>'''
        
        from jinja2 import Template
        template = Template(template_str)
        return template.render(
            username=username,
            request_title=request_title,
            request_description=request_description,
            response_text=response_text,
            problem_type=problem_type,
            app_name=app_name,
            current_year=datetime.now().year
        )

    async def send_email_change_confirmation_email(self, old_email: str, new_email: str, token: str, username: str) -> bool:
        self._initialize()

        if not self.base_url:
            logger.error("BASE_URL not configured")
            return False

        if not self.base_url.startswith(('http://', 'https://')):
            self.base_url = f"http://{self.base_url}"
            logger.warning(f"BASE_URL updated to include protocol: {self.base_url}")

        if not all([self.smtp_username, self.smtp_password]):
            logger.warning(f"Email change confirmation URL: {self.base_url}/v1/users/confirm-email-change?token={token}")
            return True

        confirmation_url = f"{self.base_url}/v1/users/confirm-email-change?token={token}"

        logger.info(f"Sending email change confirmation to {old_email} (new email: {new_email})")

        subject = f"Подтверждение смены email в БИТОК"

        html_content = self._render_email_change_template(
            username=username,
            old_email=old_email,
            new_email=new_email,
            confirmation_url=confirmation_url,
            app_name=self.app_name
        )

        for attempt in range(3):
            try:
                success = await self._send_email(
                    to_email=old_email,
                    subject=subject,
                    html_content=html_content
                )

                if success:
                    logger.info(f"Email change confirmation successfully sent to {old_email}")
                    return True

            except Exception as e:
                logger.error(f"Error sending email change confirmation to {old_email} (attempt {attempt + 1}): {str(e)}")

            if attempt < 2:
                await asyncio.sleep(5)

        logger.error(f"All attempts failed to send email change confirmation to {old_email}")
        return False

    def _render_email_change_template(
        self,
        username: str,
        old_email: str,
        new_email: str,
        confirmation_url: str,
        app_name: str
    ) -> str:
        template_str = """<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Подтверждение смены email</title>
    <style type="text/css">
        body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }

        body { font-family: Arial, sans-serif; color: white; background-color: #0a0a0a; }
        .container { max-width: 600px; margin: 0 auto; }

        .header { background-color: #0a0a0a; padding: 25px 0; text-align: center; }
        .logo { color: #ffffff; font-size: 32px; font-weight: bold; text-decoration: none; margin-bottom: 30px; }
        .logo-red { color: #dc2626; }

        .content { background-color: #0a0a0a; padding: 40px 30px; }
        .title { color: white; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center; }
        .greeting { color: #e5e5e5; font-size: 16px; line-height: 1.6; margin-bottom: 25px; text-align: center; }

        .email-box { background: #1a1a1a; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626; }
        .email-label { color: #e5e5e5; font-size: 14px; margin-bottom: 5px; }
        .email-value { color: white; font-size: 16px; font-weight: bold; }

        .warning { background: #1a1a1a; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .warning-title { color: #f59e0b; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .warning-text { color: #e5e5e5; font-size: 14px; line-height: 1.6; }

        .button-box { text-align: center; margin: 30px 0; }
        .button { display: inline-block; background-color: #dc2626; color: white !important; text-decoration: none;
                        padding: 14px 35px; border-radius: 6px; font-size: 16px; font-weight: bold; border: none; }
        
        .footer { background-color: #0a0a0a; color: #e5e5e5; padding: 25px; text-align: center; font-size: 12px; }
        .footer a { color: #cccccc; text-decoration: none; }
        .copyright { margin-top: 15px; }

        @media only screen and (max-width: 600px) {
            .content { padding: 25px 15px; }
        }
    </style>
</head>
<body>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0a0a">
        <tr>
            <td align="center">
                <table class="container" width="600" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td class="header">
                            <div class="logo">BEAT<span class="logo-red">OK</span></div>
                        </td>
                    </tr>

                    <tr>
                        <td class="content">
                            <h1 class="title">Подтверждение смены email</h1>
                            <p class="greeting">Здравствуйте, {{ username }}!</p>
                            <p class="greeting">Вы запросили смену email адреса на {{ app_name }}.</p>

                            <div class="email-box">
                                <div class="email-label">Текущий email:</div>
                                <div class="email-value">{{ old_email }}</div>
                                <div style="margin: 15px 0; color: #e5e5e5;">⬇️</div>
                                <div class="email-label">Новый email:</div>
                                <div class="email-value">{{ new_email }}</div>
                            </div>

                            <div class="warning">
                                <div class="warning-title">⚠️ Внимание</div>
                                <div class="warning-text">
                                    Если вы не запрашивали смену email, немедленно свяжитесь с поддержкой или измените пароль.
                                </div>
                            </div>

                            <div class="button-box">
                                <a href="{{ confirmation_url }}" class="button">Подтвердить смену email</a>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td class="footer">
                            <div class="copyright">
                                © {{ current_year }} БИТОК. Все права защищены.
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""

        from jinja2 import Template
        template = Template(template_str)
        return template.render(
            username=username,
            old_email=old_email,
            new_email=new_email,
            confirmation_url=confirmation_url,
            app_name=app_name,
            current_year=datetime.now().year
        )

email_service = EmailService()
