from fastapi import FastAPI
from src.api import main_router
from fastapi.middleware.cors import CORSMiddleware


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