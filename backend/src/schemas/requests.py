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
    response: Optional[str] = None
    response_at: Optional[datetime] = None

class RequestResponseUpdate(BaseModel):
    response: str

class RequestsResponse(BaseModel):
    id: int
    title: str
    description: str
    problem_type: str
    status: str
    response: Optional[str] = None
    response_at: Optional[datetime] = None
    created_at: datetime
    user_id: int
    user: Optional[UserInfo] = None
    
    model_config = ConfigDict(from_attributes=True)
