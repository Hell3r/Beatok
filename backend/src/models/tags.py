from sqlalchemy import String, Integer, Boolean, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database.database import Base
from typing import Optional

class TagModel(Base):
    __tablename__ = "tags"
    __table_args__ = (
        Index('ix_tags_beat_id_name', 'beat_id', 'name'),
    )
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    beat_id: Mapped[int] = mapped_column(ForeignKey("beats.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    beat: Mapped["BeatModel"] = relationship("BeatModel", back_populates="tags")
    
    def __repr__(self):
        return f"<Tag {self.name} for beat {self.beat_id}>"