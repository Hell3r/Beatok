from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from typing import Optional
from datetime import date, datetime

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    birthday: date
    password: str

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        if not v.replace('_', '').isalnum():
            raise ValueError('Username must contain only letters, numbers and underscores')
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class UsersSchema(BaseModel):
    username: str
    email: EmailStr


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    birthday: date
    balance: float
    is_active: bool
    avatar_path: Optional[str] = None
    date_of_reg: date
    last_login: Optional[datetime] = None
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class DeleteUserRequest(BaseModel):
    user_id: int

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
    
    
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    birthday: Optional[date] = None
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
    
    
    
class VerifyEmailRequest(BaseModel):
    token: str


class MessageResponse(BaseModel):
    message: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr