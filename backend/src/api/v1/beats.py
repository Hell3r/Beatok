from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Depends
from typing import Optional, List
from typing_extensions import Annotated
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
import os
import shutil
import aiofiles
from pathlib import Path
from src.dependencies import SessionDep
from src.models.beats import BeatModel
from src.schemas.beats import BeatResponse, BeatListResponse
from src.services.AuthService import get_current_user, get_current_user_id

router = APIRouter(prefix="/beats", tags=["Аудио файлы"])

AUDIO_STORAGE = Path("audio_storage")
AUDIO_STORAGE.mkdir(parents=True, exist_ok=True)

@router.post("/create", response_model=BeatResponse, summary = "Добавить файл")
async def create_beat(
    session: SessionDep,
    current_user_id: Annotated[int, Depends(get_current_user_id)],
    name: str = Form(...),
    genre: str = Form(...),
    tempo: int = Form(...),
    key: str = Form(...),
    promotion_status: str = Form("standard"),
    status: str = Form("active"),
    mp3_file: UploadFile = File(None),
    wav_file: UploadFile = File(None),
):
    
    if mp3_file and mp3_file.filename and not mp3_file.filename.lower().endswith('.mp3'):
        raise HTTPException(400, "MP3 файл должен иметь расширение .mp3")
    
    if wav_file and wav_file.filename and not wav_file.filename.lower().endswith('.wav'):
        raise HTTPException(400, "WAV файл должен иметь расширение .wav")

    beat = BeatModel(
        name=name,
        genre=genre,
        author_id = current_user_id,
        tempo=tempo,
        key=key,
        promotion_status=promotion_status,
        status=status,
        mp3_path=None,
        wav_path=None,
        size=0,
        duration=0.0
    )
    
    session.add(beat)
    await session.flush() 
    
    try:
        if mp3_file or wav_file:
            beat_folder = AUDIO_STORAGE / "beats" / str(beat.id)
            beat_folder.mkdir(parents=True, exist_ok=True)
            
            total_size = 0
            
            if mp3_file or wav_file:
                beat_folder = AUDIO_STORAGE / "beats" / str(beat.id)
                beat_folder.mkdir(parents=True, exist_ok=True)
            
            total_size = 0
            
            if mp3_file and mp3_file.filename:
                mp3_path = beat_folder / "audio.mp3"
                content = await mp3_file.read() 
                async with aiofiles.open(mp3_path, "wb") as f:
                    await f.write(content)
                beat.mp3_path = str(mp3_path.relative_to(AUDIO_STORAGE))
                total_size += len(content)
            
            if wav_file and wav_file.filename:
                wav_path = beat_folder / "audio.wav"
                content = await wav_file.read()
                async with aiofiles.open(wav_path, "wb") as f:
                    await f.write(content)
                beat.wav_path = str(wav_path.relative_to(AUDIO_STORAGE))
                total_size += len(content)
            
            beat.size = total_size
        
        await session.commit()
        result = await session.execute(
            select(BeatModel)
            .where(BeatModel.id == beat.id)
            .options(selectinload(BeatModel.owner)))
        
        beat_with_user = result.scalar_one()

        return BeatResponse.model_validate(beat_with_user)
        
    except Exception as e:
        await session.rollback()
        beat_folder = AUDIO_STORAGE / "beats" / str(beat.id)
        if beat_folder.exists():
            shutil.rmtree(beat_folder, ignore_errors=True)
        raise HTTPException(500, f"Ошибка: {str(e)}")



@router.get("/", response_model=List[BeatResponse])
async def get_beats(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100
):
    from sqlalchemy.orm import selectinload
    
    result = await session.execute(
        select(BeatModel)
        .options(selectinload(BeatModel.owner))
        .offset(skip)
        .limit(limit)
        .order_by(BeatModel.created_at.desc())
    )
    
    beats = result.scalars().all()
    return [BeatResponse.model_validate(beat) for beat in beats]


@router.get("/{beat_id}", response_model=BeatResponse)
async def get_beat(
    beat_id: int,
    session: SessionDep
):
    from sqlalchemy.orm import selectinload
    
    result = await session.execute(
        select(BeatModel)
        .options(selectinload(BeatModel.user))
        .where(BeatModel.id == beat_id)
    )
    
    beat = result.scalar_one_or_none()
    if not beat:
        raise HTTPException(404, "Бит не найден")
    
    return BeatResponse.model_validate(beat)




@router.get("/{beat_id}/stream", summary="Стриминг файла")
async def stream_beat(
    session : SessionDep,
    beat_id: int,
    format: str = Query("mp3", regex="^(mp3|wav)$"),
):
    result = await session.execute(select(BeatModel).where(BeatModel.id == beat_id))
    beat = result.scalar_one_or_none()
    
    if not beat:
        raise HTTPException(404, "Бит не найден")
    
    file_path = beat.mp3_path if format == "mp3" else beat.wav_path
    
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(404, "Аудиофайл не найден")
    
    from fastapi.responses import FileResponse
    
    media_type = "audio/mpeg" if format == "mp3" else "audio/wav"
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=f"{beat.name}.{format}"
    )


@router.delete("/{beat_id}", summary= "Удалить файл по id")
async def delete_beat(
    beat_id: int,
    session : SessionDep
):
    result = await session.execute(select(BeatModel).where(BeatModel.id == beat_id))
    beat = result.scalar_one_or_none()
    
    if not beat:
        raise HTTPException(404, "Бит не найден")
    
    
    beat_folder = AUDIO_STORAGE / "beats" / str(beat_id)
    if beat_folder.exists():
        shutil.rmtree(beat_folder, ignore_errors=True)
    
    await session.delete(beat)
    await session.commit()
    
    return {"message": "Бит удален"}