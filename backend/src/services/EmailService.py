import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
import os
import logging
import asyncio
from jinja2 import Template

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

        # Ensure BASE_URL has protocol
        if not self.base_url.startswith(('http://', 'https://')):
            self.base_url = f"http://{self.base_url}"
            logger.warning(f"BASE_URL updated to include protocol: {self.base_url}")

        if not all([self.smtp_username, self.smtp_password]):
            logger.warning(f"Verification URL: {self.base_url}/v1/users/auth/verify-email?token={token}")
            return True

        verification_url = f"{self.base_url}/v1/users/auth/verify-email?token={token}"

        print(verification_url)
        
        logger.info(f"Sending verification email to {email}")
        
        subject = f"Подтверждение регистрации в Beatok"
        
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

        # Ensure BASE_URL has protocol
        if not self.base_url.startswith(('http://', 'https://')):
            self.base_url = f"http://{self.base_url}"
            logger.warning(f"BASE_URL updated to include protocol: {self.base_url}")

        if not all([self.smtp_username, self.smtp_password]):
            logger.warning(f"Password reset URL: {self.base_url}/reset-password?token={token}")
            return True

        reset_url = f"{self.base_url}/reset-password?token={token}"

        logger.info(f"Sending password reset email to {email}")

        subject = f"Восстановление пароля в Beatok"

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

            # Attach HTML part with explicit Content-Type and charset
            html_part = MIMEText(html_content, "html", "utf-8")
            html_part.replace_header('Content-Type', 'text/html; charset=utf-8')
            message.attach(html_part)
            
            import ssl
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            
            # Используем SMTP_SSL для порта 465
            if self.smtp_port == 465:
                smtp = aiosmtplib.SMTP(
                    hostname=self.smtp_host,
                    port=self.smtp_port,
                    use_tls=True,
                    tls_context=context
                )
            # Или SMTP с STARTTLS для порта 587
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
        download_url: str,
        purchase_details: dict,
        expires_in_hours: int = 72
        ) -> bool:
        
        self._initialize()
        if not all([self.smtp_username, self.smtp_password]):
            logger.warning("SMTP не настроен, не могу отправить письмо")
            return False
        
        subject = f"🎵 Ссылка на скачивание бита '{beat_name}' | Beatok"
        
        # HTML с табличной вёрсткой
        html_content = self._render_download_link_template(
            username=username,
            beat_name=beat_name,
            download_url=download_url,
            purchase_details=purchase_details,
            expires_in_hours=expires_in_hours,
            app_name=self.app_name
        )
        
        try:
            message = MIMEMultipart("alternative")
            message["From"] = formataddr((self.from_name, self.from_email))
            message["To"] = to_email
            message["Subject"] = subject
            
            # Текстовая версия
            text_content = f"""
            Здравствуйте, {username}!
            
            Спасибо за покупку на Beatok!
            
            🎧 Детали покупки:
            • Бит: {beat_name}
            • Тариф: {purchase_details.get('tariff_name', 'Standard')}
            • Цена: {purchase_details.get('price', 0)} руб.
            • ID покупки: {purchase_details.get('purchase_id', 'N/A')}
            
            📥 Скачать бит:
            {download_url}
            
            ⚠️ Важно:
            • Ссылка действительна {expires_in_hours} часов
            • Максимум 5 скачиваний
            • Не передавайте ссылку другим
            
            Спасибо, что выбрали Beatok!
            """
            
            message.attach(MIMEText(text_content, "plain", "utf-8"))
            message.attach(MIMEText(html_content, "html", "utf-8"))
            
            # Отправка
            smtp = aiosmtplib.SMTP(hostname=self.smtp_host, port=self.smtp_port)
            await smtp.connect()
            await smtp.login(self.smtp_username, self.smtp_password)
            await smtp.send_message(message)
            await smtp.quit()
            
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
                <p style="color:#999999; font-size:12px; margin:0;">Beatok &copy; 2025</p>
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
                <p style="color:#999999; font-size:12px; margin:0;">Beatok &copy; 2025</p>
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
        download_url: str,
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
            /* Reset */
            body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
            
            /* Main styles */
            body { font-family: Arial, Helvetica, sans-serif; color: #333333; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; }
            
            /* Header */
            .header { background-color: #111111; padding: 25px 0; text-align: center; }
            .logo { color: #ffffff; font-size: 28px; font-weight: bold; text-decoration: none; }
            .logo-red { color: #dc2626; }
            
            /* Content */
            .content { background-color: #ffffff; padding: 40px 30px; }
            .title { color: #111111; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .greeting { color: #444444; font-size: 16px; line-height: 1.6; margin-bottom: 25px; }
            
            /* Purchase info table */
            .info-table { width: 100%; border: 1px solid #e0e0e0; border-collapse: collapse; margin: 25px 0; }
            .info-table td { padding: 15px 20px; border-bottom: 1px solid #e0e0e0; }
            .info-table .label { color: #666666; font-weight: bold; width: 40%; background-color: #f9f9f9; }
            .info-table .value { color: #333333; }
            .info-table tr:last-child td { border-bottom: none; }
            
            /* Download section */
            .download-box { background-color: #f0f7ff; border: 2px dashed #3b82f6; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0; }
            .download-title { color: #1e40af; font-size: 20px; font-weight: bold; margin-bottom: 15px; }
            .download-button { display: inline-block; background-color: #dc2626; color: white !important; text-decoration: none; 
                            padding: 14px 35px; border-radius: 5px; font-size: 16px; font-weight: bold; margin: 15px 0; }
            .download-url { color: #3b82f6; word-break: break-all; font-size: 14px; margin-top: 15px; }
            
            /* Instructions */
            .instructions { background-color: #fff7ed; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; }
            .instructions-title { color: #92400e; font-weight: bold; margin-bottom: 10px; }
            .instructions-list { color: #78350f; margin: 0; padding-left: 20px; }
            .instructions-list li { margin-bottom: 8px; }
            
            /* Footer */
            .footer { background-color: #111111; color: #999999; padding: 25px; text-align: center; font-size: 12px; }
            .footer a { color: #cccccc; text-decoration: none; }
            .footer-links { margin-bottom: 15px; }
            .footer-links a { margin: 0 10px; }
            .copyright { margin-top: 15px; }
            
            /* Mobile */
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
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f5f5">
            <tr>
                <td align="center">
                    <table class="container" width="600" cellpadding="0" cellspacing="0" border="0">
                        <!-- Header -->
                        <tr>
                            <td class="header">
                                <a href="{{ base_url }}" class="logo">BEAT<span class="logo-red">OK</span></a>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td class="content">
                                <h1 class="title">Ваш бит готов к скачиванию! 🎵</h1>
                                
                                <p class="greeting">
                                    Здравствуйте, <strong>{{ username }}</strong>!<br>
                                    Спасибо за покупку на {{ app_name }}. Ваш WAV файл доступен для скачивания по ссылке ниже.
                                </p>
                                
                                <!-- Purchase Details Table -->
                                <table class="info-table">
                                    <tr>
                                        <td class="label">Название бита:</td>
                                        <td class="value"><strong>{{ beat_name }}</strong></td>
                                    </tr>
                                    <tr>
                                        <td class="label">Тариф:</td>
                                        <td class="value">{{ purchase_details.tariff_name }}</td>
                                    </tr>
                                    <tr>
                                        <td class="label">Цена:</td>
                                        <td class="value">{{ purchase_details.price }} руб.</td>
                                    </tr>
                                    <tr>
                                        <td class="label">ID покупки:</td>
                                        <td class="value">#{{ purchase_details.purchase_id }}</td>
                                    </tr>
                                    <tr>
                                        <td class="label">Дата покупки:</td>
                                        <td class="value">{{ purchase_details.purchase_date }}</td>
                                    </tr>
                                </table>
                                
                                <!-- Download Section -->
                                <div class="download-box">
                                    <div class="download-title">Скачать WAV файл</div>
                                    <a href="{{ download_url }}" class="download-button">⬇️ СКАЧАТЬ БИТ</a>
                                    <div class="download-url">
                                        Или скопируйте ссылку:<br>
                                        <a href="{{ download_url }}">{{ download_url }}</a>
                                    </div>
                                </div>
                                
                                <!-- Instructions -->
                                <div class="instructions">
                                    <div class="instructions-title">📌 Важная информация:</div>
                                    <ul class="instructions-list">
                                        <li>Ссылка действительна <strong>{{ expires_in_hours }} часов</strong></li>
                                        <li>Доступно <strong>5 попыток</strong> скачивания</li>
                                        <li>Файл в формате WAV (высокое качество)</li>
                                        <li>Используйте согласно условиям тарифа "{{ purchase_details.tariff_name }}"</li>
                                        <li>Не передавайте ссылку третьим лицам</li>
                                    </ul>
                                </div>
                                
                                <!-- Support -->
                                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                                    Если возникли проблемы со скачиванием или у вас есть вопросы,<br>
                                    ответьте на это письмо или напишите в поддержку: 
                                    <a href="mailto:support@beatok.ru">support@beatok.ru</a>
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td class="footer">
                                <div class="footer-links">
                                    <a href="{{ base_url }}/terms">Условия использования</a> | 
                                    <a href="{{ base_url }}/privacy">Конфиденциальность</a> | 
                                    <a href="{{ base_url }}/support">Поддержка</a>
                                </div>
                                <div class="copyright">
                                    © {{ current_year }} {{ app_name }}. Все права защищены.<br>
                                    Это письмо отправлено автоматически, пожалуйста, не отвечайте на него.
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
            download_url=download_url,
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

email_service = EmailService()