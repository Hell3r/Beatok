from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from typing import Optional
from datetime import date

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
    username: str
    email: EmailStr
    birthday: date
    role: str
    is_active: bool
    avatar_path: str

    class Config:
        from_attributes = True

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
    
    model_config = ConfigDict(from_attributes=True)
    