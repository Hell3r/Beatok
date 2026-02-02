import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Any
from fastapi.templating import Jinja2Templates

class TemplateService:
    
    def __init__(self):
        current_dir = Path(__file__).parent.parent
        templates_dir = current_dir / "templates"
        
        self.templates = Jinja2Templates(directory=str(templates_dir))
    
    def render_download_confirm(
        self,
        beat_name: str,
        downloads_left: int,
        expires_at: datetime,
        download_action_url: str,
        direct_download_url: str
    ) -> str:
        return self.templates.get_template("download_confirm.html").render(
            beat_name=beat_name,
            downloads_left=downloads_left,
            expires_at=expires_at.strftime('%d.%m.%Y %H:%M'),
            download_action_url=download_action_url,
            direct_download_url=direct_download_url,
            current_year=datetime.now().year
        )
    
    def render_error_page(
        self,
        error_title: str,
        error_message: str,
        home_url: str = "/"
    ) -> str:
        return self.templates.get_template("error_page.html").render(
            error_title=error_title,
            error_message=error_message,
            home_url=home_url
        )

template_service = TemplateService()