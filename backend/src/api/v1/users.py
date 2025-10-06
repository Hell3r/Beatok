from typing_extensions import List
from fastapi import APIRouter, HTTPException, status, Depends, Response, Path, Form, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, delete
from src.models.users import UsersModel
from src.dependencies import SessionDep
from typing import Optional
import os
import uuid
from datetime import date
from src.schemas.users import DeleteUserRequest, UsersSchema, UserResponse, UserCreate, TokenResponse
from src.services.AuthService import (
    add_to_blacklist,
    pwd_context, 
    oauth2_scheme,
    create_access_token,
    authenticate_user,
    token_blacklist,
    verify_password,
    check_username_exists,
    check_email_exists,
    get_password_hash
)

router = APIRouter(prefix="/v1/users")

AVATAR_DIR = "static/avatars"
DEFAULT_AVATAR_PATH = "static/default_avatar.png"

os.makedirs(AVATAR_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024 





@router.post("/login", tags=["Пользователи"],summary = ["Авторизация"])
async def login_user(
    session: SessionDep,
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = await authenticate_user(form_data.username, form_data.password, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_info": {
            "email": user.email,
            "username": user.username,
            "user_id": user.id,
            "avatar_path": user.avatar_path,
            "birthday": user.birthday
        }
    }

@router.post("/logout", tags=["Пользователи"], summary=["Выход"])
async def logout_user(
    session: SessionDep,
    response: Response,
    token: str = Depends(oauth2_scheme),
):
    try:
        await add_to_blacklist(token)

        response.delete_cookie("access_token")
        
        return {
            "message": "Logout successful",
            "detail": "Token invalidated. Client should discard the token."
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout error: {str(e)}"
        )
    
    
@router.get("/users", response_model=List[UserResponse], tags=["Пользователи"], summary=["Получить всех пользователей"])
async def get_all_users(session: SessionDep):
    try:
        result = await session.execute(select(UsersModel))
        users = result.scalars().all()
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    
@router.post("/register", response_model=TokenResponse, tags=["Пользователи"], summary="Регистрация")
async def register(
    user_data: UserCreate,
    session: SessionDep
):
    if await check_username_exists(user_data.username, session):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    if await check_email_exists(user_data.email, session):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    try:
        hashed_password = get_password_hash(user_data.password)
        
        user = UsersModel(
            username=user_data.username,
            email=user_data.email,
            birthday=user_data.birthday,
            password=hashed_password,
            is_active=True,
            date_of_reg=date.today(),
            avatar_path="static/default_avatar.png"
        )

        session.add(user)
        await session.commit()
        await session.refresh(user)

        access_token = create_access_token(data={"sub": user.username})

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user.id,
                username=user.username,
                email=user.email,
                birthday=user.birthday,
                is_active=user.is_active
            )
        )

    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )
        
        
        
@router.get("/check-username/{username}", tags = ["Пользователи"], summary="Проверить Имя на уникальность")
async def check_username_available(
    username: str,
    session: SessionDep
):
    exists = await check_username_exists(username, session)
    return {"available": not exists}

@router.get("/check-email/{email}", tags = ["Пользователи"], summary="Проверить Email на уникальность")
async def check_email_available(
    email: str,
    session: SessionDep
):
    exists = await check_email_exists(email, session)
    return {"available": not exists}

@router.get("/{user_id}", response_model=UserResponse, tags=["Пользователи"], summary="Получить профиль пользователя")
async def get_user_profile(
    user_id: int,
    session: SessionDep
):
    try:
        user_stmt = select(UsersModel).where(UsersModel.id == user_id)
        user_result = await session.execute(user_stmt)
        user = user_result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )

        return UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            birthday=user.birthday,
            is_active=user.is_active,
            avatar_path=user.avatar_path or "static/default_avatar.png"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении профиля: {str(e)}"
        )

@router.put("/{user_id}", response_model=UserResponse, tags=["Пользователи"], summary="Обновить профиль пользователя")
async def update_user_profile(
    user_id: int,
    user_data: dict,
    session: SessionDep
):
    try:
        user_stmt = select(UsersModel).where(UsersModel.id == user_id)
        user_result = await session.execute(user_stmt)
        user = user_result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )

        for key, value in user_data.items():
            if key in ['username', 'email', 'birthday']:
                setattr(user, key, value)

        await session.commit()
        await session.refresh(user)

        return UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            birthday=user.birthday,
            is_active=user.is_active,
            avatar_path=user.avatar_path or "static/default_avatar.png"
        )

    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при обновлении профиля: {str(e)}"
        )

    
    
    
    
    
    
@router.post("/{user_id}/avatar", tags = ["Пользователи"], summary="Загрузить аватарку пользователя")
async def upload_avatar(
    user_id: int,
    file: UploadFile = File(...),
    session: SessionDep = None
):
    try:
        from src.models.users import UsersModel
        user_stmt = select(UsersModel).where(UsersModel.id == user_id)
        user_result = await session.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        

        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Разрешены только файлы: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        file_size = 0
        content = await file.read()
        file_size = len(content)
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Файл слишком большой. Максимальный размер: 5MB"
            )
        
        filename = f"{user_id}_{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(AVATAR_DIR, filename)
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        
        user.avatar_path = filename
        await session.commit()
        
        return {"message": "Аватарка успешно загружена", "avatar_path": filename}
        
    except Exception as e:
        await session.rollback()
        print(f"Error uploading avatar: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при загрузке аватарки"
        )
        
        
        
@router.get("/{user_id}/avatar", tags = ["Пользователи"], summary="Получить аватарку пользователя")
async def get_user_avatar(
    user_id: int,
    session: SessionDep
):
    try:
        user_stmt = select(UsersModel).where(UsersModel.id == user_id)
        user_result = await session.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        avatar_path = None
        
        if user.avatar_path and user.avatar_path != "default_avatar.png":
            user_avatar_path = os.path.join(AVATAR_DIR, user.avatar_path)
            if os.path.exists(user_avatar_path):
                avatar_path = user_avatar_path
        

        if not avatar_path:
            avatar_path = DEFAULT_AVATAR_PATH
            if not os.path.exists(avatar_path):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Аватарка не найдена"
                )
        
        return FileResponse(avatar_path)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting avatar: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при получении аватарки"
        )