from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from src.models import *
from src.core.config import settings


DATABASE_URL = settings.DATABASE_URL

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
