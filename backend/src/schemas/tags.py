from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Optional, List

class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="Название тега")

class TagCreate(TagBase):
    beat_id: int

class TagResponse(TagBase):
    id: int
    beat_id: int
    
    model_config = ConfigDict(from_attributes=True)

class TagList(BaseModel):
    tags: List[str] = Field(..., max_length=10, description="Список тегов, максимум 10")
    
    @model_validator(mode='after')
    def validate_tags(cls, values):
        tags = values.tags
        for tag in tags:
            if len(tag) > 50:
                raise ValueError(f"Тег '{tag}' слишком длинный (максимум 50 символов)")
            if len(tag.strip()) == 0:
                raise ValueError("Тег не может быть пустым")
        return values

class PopularTagResponse(BaseModel):
    name: str
    count: int
    
    model_config = ConfigDict(from_attributes=True)