from fastapi import FastAPI, Request, HTTPException
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
from src.telegram_bot.main import run_telegram_bot
from src.database.deps import SessionDep
from src.services.RedisService import redis_service
from src.core.config import settings
from src.services.rate_limiter import check_rate_limit

logger = logging.getLogger(__name__)

telegram_bot_started = False

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
        
        
async def initialize_redis():
    try:
        success = await redis_service.connect()
        if success:
            logger.info("✅ Redis successfully connected and cache enabled")
            
            test_result = await redis_service.set("health_check", {"status": "ok", "app": "Beatok"}, 60)
            if test_result:
                logger.info("✅ Redis cache test passed")
            else:
                logger.warning("⚠️ Redis cache test failed")
        else:
            logger.warning("⚠️ Redis connection failed - running without cache")
    except Exception as e:
        logger.warning(f"⚠️ Redis initialization error: {e} - running without cache")
        
        
@app.middleware("http")
async def global_rate_limit_middleware(request: Request, call_next):
    if request.url.path.startswith(("/static/", "/audio_storage/", "/docs", "/redoc")):
        return await call_next(request)
    
    try:
        await check_rate_limit(request, "api_global")
    except HTTPException:
        raise
    except Exception:
        pass 
    
    response = await call_next(request)
    return response        




@app.on_event("startup")
async def startup_event():
    await initialize_redis()
     
    ensure_default_avatar_exists()

    global telegram_bot_started
    if TelegramConfig.is_configured() and not telegram_bot_started:
        await support_bot.send_welcome_messages()
        asyncio.create_task(run_telegram_bot_with_error_handling())
        telegram_bot_started = True
        print("Telegram bot started")
    else:
        print("Telegram bot not configured or already started - skipping startup")

    task_manager.start_cleanup_tasks()
    logger.info(" Application started with background tasks")

async def run_telegram_bot_with_error_handling():
    try:
        await run_telegram_bot()
    except Exception as e:
        print(f"Telegram bot failed: {e}")
        # Reset flag to allow restart if needed
        global telegram_bot_started
        telegram_bot_started = False

app.mount("/audio_storage", StaticFiles(directory="audio_storage", html=False), name="audio_storage")
app.mount("/static", StaticFiles(directory="static", html=False), name="static")

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

@app.on_event("shutdown") 
async def shutdown_event():
    await redis_service.disconnect()
    task_manager.shutdown()
    logger.info(" Application shutdown")