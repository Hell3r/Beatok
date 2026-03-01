from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TermsOfUseBase(BaseModel):
    recording_tracks: bool
    commercial_perfomance: bool
    rotation_on_the_radio: bool
    music_video_recording: bool
    release_of_copies: bool

class TermsOfUseCreate(TermsOfUseBase):
    beat_id: int

class TermsOfUseResponse(TermsOfUseBase):
    id: int
    beat_id: int
    
    class Config:
        from_attributes = True