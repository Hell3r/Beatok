from sqlalchemy import String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database.database import Base
from typing import Optional

class TermsOfUseModel(Base):
    __tablename__ = "terms_of_use"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    beat_id: Mapped[int] = mapped_column(ForeignKey("beats.id"), nullable=False, index=True)
    recording_tracks: Mapped[bool] = mapped_column(Boolean, nullable=False)
    commercial_perfomance: Mapped[bool] = mapped_column(Boolean, nullable=False)
    rotation_on_the_radio: Mapped[bool] = mapped_column(Boolean, nullable=False)
    music_video_recording: Mapped[bool] = mapped_column(Boolean, nullable=False)
    release_of_copies: Mapped[bool] = mapped_column(Boolean, nullable=False)
    
    beat: Mapped["BeatModel"] = relationship("BeatModel", backref="terms_of_use_backref")