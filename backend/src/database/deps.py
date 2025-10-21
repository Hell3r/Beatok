from fastapi import Depends
from typing_extensions import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.database import get_session

SessionDep = Annotated[AsyncSession, Depends(get_session)]
