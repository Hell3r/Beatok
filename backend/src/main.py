from fastapi import FastAPI
from src.api import main_router
import logging
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from src.scripts.create_default_avatar import create_default_avatar
from dotenv import load_dotenv
from src.tasks.background import task_manager
import os, asyncio
from src.telegram_bot import support_bot, TelegramConfig


logger = logging.getLogger(__name__)


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)


app = FastAPI(
    title = "Beatok API",
    version = "1.0.0",
    docs_url= None
)
app.include_router(main_router)


origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:3000",
    "http://localhost:5173",
    
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, 
    allow_methods=["*"],     
    allow_headers=["*"],   
)

def ensure_default_avatar_exists():
    default_avatar_path = "static/default_avatar.png"
    if not os.path.exists(default_avatar_path):
        create_default_avatar()


@app.on_event("startup")
async def startup_event():
    ensure_default_avatar_exists()
    
    



app.mount("/audio_storage", StaticFiles(directory="audio_storage"), name="audio_storage")
app.mount("/static", StaticFiles(directory="static"), name="static")



@app.get("/docs", include_in_schema=False)
def custom_swagger():
    html_content = get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title="API Docs",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    ).body.decode("utf-8")
    
    custom_css_link = '<link rel="stylesheet" type="text/css" href="/static/dark_theme.css">'
    html_content = html_content.replace('</head>', custom_css_link + '</head>')
    
    return HTMLResponse(content=html_content)



@app.on_event("startup")
async def startup_event():
    if TelegramConfig.is_configured():
        await support_bot.send_welcome_messages()
        print("Telegram bot started")
    else:
        print("Telegram bot not configured - skipping startup")



@app.on_event("startup")
async def startup_event_bacground():
    task_manager.start_cleanup_tasks()
    logger.info(" Application started with background tasks")

@app.on_event("shutdown") 
async def shutdown_event():
    task_manager.shutdown()
    logger.info(" Application shutdown")