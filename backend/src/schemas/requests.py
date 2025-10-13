from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class UserInfo(BaseModel):
    id: int
    username: str
    email: str
    
    model_config = ConfigDict(from_attributes=True)

class RequestsSchema(BaseModel):
    title: str
    description: str
    problem_type: str

class RequestCreate(RequestsSchema):
    pass

class RequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    problem_type: Optional[str] = None
    status: Optional[str] = None

class RequestsResponse(BaseModel):
    id: int
    title: str
    description: str
    problem_type: str
    status: str
    created_at: datetime
    user_id: int
    user: Optional[UserInfo] = None
    
    model_config = ConfigDict(from_attributes=True)
