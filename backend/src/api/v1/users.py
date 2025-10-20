from typing_extensions import List
from fastapi import APIRouter, HTTPException, status, Depends, Response, Path, Form, File, UploadFile, BackgroundTasks
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, delete, and_ 
from src.models.users import UsersModel
from src.dependencies import SessionDep
from typing import Optional
import logging
import os
import uuid
from datetime import date
from src.models.email_verification import EmailVerificationModel
from src.schemas.users import DeleteUserRequest, UsersSchema, UserResponse, UserCreate, TokenResponse, UserUpdate, VerifyEmailRequest, MessageResponse, ResendVerificationRequest
from src.services.EmailService import email_service
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
    get_password_hash,
    get_current_user
)

templates = Jinja2Templates(directory="src/templates")
router = APIRouter(prefix="/v1/users")
logger = logging.getLogger(__name__)

AVATAR_DIR = "static/avatars"
DEFAULT_AVATAR_PATH = "static/default_avatar.png"

os.makedirs(AVATAR_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024 





@router.post("/login", tags=["Пользователи"], summary="Авторизация")
async def login_user(
    session: SessionDep,
    form_data: OAuth2PasswordRequestForm = Depends()
):

    try:
        user = await authenticate_user(form_data.username, form_data.password, session)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный email или пароль",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Аккаунт не активирован. Подтвердите ваш email.",
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
                "birthday": user.birthday,
                "role": user.role,
                "is_active": user.is_active 
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error for {form_data.username}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Произошла ошибка при входе в систему"
        )

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
            role = user.role,
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
        
        
        
        
        
@router.patch("/me", response_model=UserResponse, tags = ["Пользователи"], summary="Обновить данные авторизованного пользователя")
async def patch_current_user(
    user_data: UserUpdate,
    session: SessionDep,
    current_user: UsersModel = Depends(get_current_user)
):
    try:
        update_data = {}
        for field, value in user_data.model_dump(exclude_unset=True).items():
            if value is not None and value != "":
                update_data[field] = value


        if 'birthday' in update_data:
           if not isinstance(update_data['birthday'], date):
               try:
                   if isinstance(update_data['birthday'], str):
                       from datetime import datetime
                       birthday = datetime.strptime(update_data['birthday'], '%Y-%m-%d').date()
                       update_data['birthday'] = birthday
                   else:
                       raise HTTPException(
                           status_code=status.HTTP_400_BAD_REQUEST,
                           detail="Invalid birthday format"
                       )
               except ValueError:
                   raise HTTPException(
                       status_code=status.HTTP_400_BAD_REQUEST,
                       detail="Invalid date format. Use YYYY-MM-DD"
                   )

        if 'username' in update_data and update_data['username'] != current_user.username:
            existing_user = await session.execute(
                select(UsersModel).where(UsersModel.username == update_data['username'])
            )
            if existing_user.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
        
        if 'email' in update_data and update_data['email'] != current_user.email:
            existing_user = await session.execute(
                select(UsersModel).where(UsersModel.email == update_data['email'])
            )
            if existing_user.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
        
        for field, value in update_data.items():
            setattr(current_user, field, value)
        
        await session.commit()
        await session.refresh(current_user)
        
        return current_user
        
    except HTTPException:
        await session.rollback()
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating user: {str(e)}"
        )
        
        
        
@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Регистрация пользователя",
    tags = ["Верификация Email и авторизация"]
)
async def register(
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    session: SessionDep
):
    try:
        existing_email = await session.execute(
            select(UsersModel).where(UsersModel.email == user_data.email)
        )
        if existing_email.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким email уже зарегистрирован"
            )
        
        existing_username = await session.execute(
            select(UsersModel).where(UsersModel.username == user_data.username)
        )
        if existing_username.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Это имя пользователя уже занято"
            )
        
        hashed_password = get_password_hash(user_data.password)
        
        user = UsersModel(
            email=user_data.email,
            username=user_data.username,
            password=hashed_password,
            birthday=user_data.birthday,
            is_active=False, 
        )
        
        session.add(user)
        await session.commit()
        await session.refresh(user)
        
        verification = EmailVerificationModel(
            email=user_data.email,
            verification_type="registration"
        )
        
        session.add(verification)
        await session.commit()
        
        background_tasks.add_task(
            email_service.send_verification_email,
            user_data.email,
            verification.token,
            user_data.username
        )
        
        logger.info(f"New user registered: {user_data.email}, verification token: {verification.token}")
        
        return MessageResponse(
            message="Регистрация успешна! На ваш email отправлено письмо с подтверждением."
        )
        
    except HTTPException:
        await session.rollback()
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Registration error for {user_data.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Произошла ошибка при регистрации. Пожалуйста, попробуйте позже."
        )



@router.get(
    "/auth/verify-email",
    response_class=HTMLResponse,
    summary="Подтверждение email адреса",
    tags = ["Верификация Email и авторизация"]
)
async def verify_email(
    token : str,
    session: SessionDep
):
    try:
        verification = await session.execute(
            select(EmailVerificationModel).where(
                EmailVerificationModel.token == token
            )
        )
        verification = verification.scalar_one_or_none()
        
        if not verification:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Неверный или устаревший токен подтверждения"
            )
        
        if not verification.is_valid():
            if verification.is_used:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Этот токен подтверждения уже был использован"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Срок действия токена подтверждения истек"
                )
        
        user = await session.execute(
            select(UsersModel).where(UsersModel.email == verification.email)
        )
        user = user.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        
        
        user.is_active = True
        
        verification.is_used = True
        
        await session.commit()
        
        access_token = create_access_token(data={"sub": user.email})
        
        logger.info(f"Email verified for user: {user.email}")
        
        return templates.TemplateResponse(
            "success_verify.html",
            {"request": {}}
        )
        
        
    except HTTPException:
        await session.rollback()
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Email verification error for token {token}: {str(e)}")
        return templates.TemplateResponse(
            "error_verify.html",
            {"request": {}, "error_message": "Произошла внутренняя ошибка сервера"}
        )
        
        
        
@router.post(
    "/resend-verification",
    response_model=MessageResponse,
    summary="Повторная отправка письма подтверждения",
    tags = ["Верификация Email и авторизация"]
)
async def resend_verification(
    resend_data: ResendVerificationRequest,
    background_tasks: BackgroundTasks,
    session: SessionDep
):
    try:
        user = await session.execute(
            select(UsersModel).where(UsersModel.email == resend_data.email)
        )
        user = user.scalar_one_or_none()
        
        if not user:
            return MessageResponse(
                message="Если пользователь с таким email существует, письмо с подтверждением будет отправлено"
            )
        
        await session.execute(
            delete(EmailVerificationModel).where( 
                and_(
                    EmailVerificationModel.email == resend_data.email,
                    EmailVerificationModel.verification_type == "registration",
                    EmailVerificationModel.is_used == False
                )
            )
        )
        
        verification = EmailVerificationModel(
            email=resend_data.email,
            verification_type="registration"
        )
        
        session.add(verification)
        await session.commit()
        
        background_tasks.add_task(
            email_service.send_verification_email,
            resend_data.email,
            verification.token,
            user.username
        )
        
        logger.info(f"Verification email resent to: {resend_data.email}")
        
        return MessageResponse(
            message="Письмо с подтверждением отправлено на ваш email"
        )
        
    except HTTPException:
        await session.rollback()
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Resend verification error for {resend_data.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Произошла ошибка при отправке письма. Пожалуйста, попробуйте позже."
        )


@router.put(
    "/{user_id}/activate", 
    response_model=MessageResponse, 
    tags=["Верификация Email и авторизация"], 
    summary="Быстро активировать аккаунт пользователя"
)
async def quick_activate_user(
    session: SessionDep,
    user_id: int = Path(..., description="ID пользователя для активации")
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

        if user.is_active:
            return MessageResponse(
                message=f"Аккаунт пользователя {user.username} (ID: {user_id}) уже активирован"
            )

        user.is_active = True
        await session.commit()

        return MessageResponse(
            message=f"Аккаунт пользователя {user.username} (ID: {user_id}) успешно активирован"
        )

    except HTTPException:
        await session.rollback()
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при активации аккаунта: {str(e)}"
        )
    

@router.put(
    "/{user_id}/change_to_admin", 
    response_model=MessageResponse, 
    tags=["Пользователи"], 
    summary="Повысить пользователя до админа"
)
async def change_user_to_admin(
    session: SessionDep,
    user_id: int = Path(..., description="ID пользователя для повышения роли")
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

        if user.role == "admin":
            return MessageResponse(
                message=f"Пользователь {user.username} (ID: {user_id}) уже администратор."
            )

        user.role = "admin"
        await session.commit()

        return MessageResponse(
            message=f"Роль пользователя {user.username} (ID: {user_id}) успешно повышена."
        )

    except HTTPException:
        await session.rollback()
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при повышении роли: {str(e)}"
        )