from fastapi import FastAPI
from src.api import main_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from src.scripts.create_default_avatar import create_default_avatar
import os

app = FastAPI()
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