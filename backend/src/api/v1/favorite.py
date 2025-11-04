from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from sqlalchemy import select
from decimal import Decimal
from src.dependencies.services import PromoServiceDep
from src.dependencies.auth import CurrentUser, AdminUser
from src.database.deps import SessionDep
from src.schemas.promo import *



router = APIRouter(prefix="/v1/favorite", tags = ["Избранное"])
