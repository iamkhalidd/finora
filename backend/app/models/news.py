from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.db.base_class import Base

class NewsBookmark(Base):
    __tablename__ = "news_bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    source = Column(String, nullable=True)
    url = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    published_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    category = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", backref="news_bookmarks")
