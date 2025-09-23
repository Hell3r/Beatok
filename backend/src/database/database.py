from sqlalchemy import select
from fastapi import Depends
from typing_extensions import Annotated
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.pool import NullPool
from src.models import *


DATABASE_URL = "postgresql+asyncpg://postgres:admin@localhost:5432/finflow"

engine = create_async_engine(DATABASE_URL, echo=True, poolclass=NullPool)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession
)

new_async_session = async_sessionmaker(engine, expire_on_commit=False)

async def get_session():
    async with new_async_session() as session:
        yield session


class Base(DeclarativeBase):
    pass


SessionDep = Annotated[AsyncSession, Depends(get_session)]