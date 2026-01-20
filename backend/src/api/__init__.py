from fastapi import APIRouter
from src.api.v1.health import router as health_router
from src.api.v1.beats import router as beats_router
from src.api.v1.users import router as users_router
from src.api.v1.tarrifs import router as tarrif_router
from src.api.v1.beat_pricing import router as price_router
from src.api.v1.requests import router as requests_router
from src.api.v1.promo import router as promo_router
from src.api.v1.cache import router as cache_router
from src.api.v1.rate_limit import router as rate_router
from src.api.v1.payments import router as payment_router
from src.api.v1.favorite import router as favorite_router
from src.api.v1.withdrawal import router as payout_router
from src.api.v1.purchase import router as purchase_router

main_router = APIRouter()


main_router.include_router(health_router)
main_router.include_router(beats_router)
main_router.include_router(users_router)
main_router.include_router(tarrif_router)
main_router.include_router(price_router)
main_router.include_router(requests_router)
main_router.include_router(promo_router)
main_router.include_router(cache_router)
main_router.include_router(rate_router)
main_router.include_router(payment_router)
main_router.include_router(favorite_router)
main_router.include_router(payout_router)
main_router.include_router(purchase_router)