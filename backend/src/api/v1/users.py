from typing_extensions import List
from fastapi import APIRouter, HTTPException, status, Depends, Response, Path, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, delete
from src.models.users import UsersModel
from src.dependencies import SessionDep
from typing import Optional
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
            date_of_reg=date.today()
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

    
    
    