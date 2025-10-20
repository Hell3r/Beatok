from fastapi import Depends, HTTPException, status
from typing_extensions import Annotated
from src.database.deps import SessionDep
from src.services.AuthService import (
    oauth2_scheme, get_current_user, get_password_hash,
    check_username_exists, check_email_exists, authenticate_user
)
from src.models.users import UsersModel

# Зависимости для FastAPI
CurrentUser = Annotated[UsersModel, Depends(get_current_user)]

async def get_current_user_id(current_user: CurrentUser) -> int:
    return current_user.id

CurrentUserId = Annotated[int, Depends(get_current_user_id)]

async def get_current_admin_user(current_user: CurrentUser) -> UsersModel:
    """Зависимость для проверки администратора"""
    if getattr(current_user, 'role', 'user') != 'admin':
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

AdminUser = Annotated[UsersModel, Depends(get_current_admin_user)]