from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class NewsBookmarkBase(BaseModel):
    title: str
    description: Optional[str] = None
    source: Optional[str] = None
    url: str
    image_url: Optional[str] = None
    published_at: Optional[datetime] = None
    category: Optional[str] = None

class NewsBookmarkCreate(NewsBookmarkBase):
    pass

class NewsBookmarkInDBBase(NewsBookmarkBase):
    id: int
    user_id: int
    published_at: datetime

    class Config:
        from_attributes = True

class NewsBookmarkSchema(NewsBookmarkInDBBase):
    pass

class NewsArticle(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    source: Optional[str] = None
    url: str
    image_url: Optional[str] = None
    published_at: str
    category: Optional[str] = None
    author: Optional[str] = None
    body: Optional[str] = None
