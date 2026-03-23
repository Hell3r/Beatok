from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from src.models import *


DATABASE_URL = "postgresql+asyncpg://admin:CzosFgElyKAF@master.a9806fa5-1071-481d-9dc2-3373c4f577a5.c.dbaas.selcloud.ru:5432/beatok_db"

engine = create_async_engine(DATABASE_URL, poolclass=NullPool)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession
)

new_async_session = async_sessionmaker(engine, expire_on_commit=False)
async_session_factory = new_async_session


async def get_session():
    async with new_async_session() as session:
        yield session

class Base(DeclarativeBase):
    pass