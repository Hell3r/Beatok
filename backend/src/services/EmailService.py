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
            
            # Attach plain text part first
            text_content = self._html_to_text(html_content)
            text_part = MIMEText(text_content, "plain", "utf-8")
            message.attach(text_part)

            # Attach HTML part with explicit Content-Type and charset
            html_part = MIMEText(html_content, "html", "utf-8")
            html_part.replace_header('Content-Type', 'text/html; charset=utf-8')
            message.attach(html_part)
            
            smtp = aiosmtplib.SMTP(hostname=self.smtp_host, port=self.smtp_port)
            await smtp.connect()
            
            await smtp.login(self.smtp_username, self.smtp_password)
            
            await smtp.send_message(message)
            
            await smtp.quit()
            
            return True
            
        except Exception as e:
            logger.error(f"SMTP error: {str(e)}")
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