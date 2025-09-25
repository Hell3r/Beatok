from fastapi import APIRouter
from src.api.v1.health import router as health_router
from src.api.v1.beats import router as beats_router
from src.api.v1.users import router as users_router

main_router = APIRouter()


main_router.include_router(health_router)
main_router.include_router(beats_router)
main_router.include_router(users_router)