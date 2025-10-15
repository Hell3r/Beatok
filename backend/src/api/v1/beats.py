from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Depends
from typing import Optional, List
from typing_extensions import Annotated
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
import os
import shutil
import aiofiles
from mutagen import File as MutagenFile
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
            
        if mp3_file and mp3_file.filename:
            mp3_path = beat_folder / "audio.mp3"
            content = await mp3_file.read() 
            async with aiofiles.open(mp3_path, "wb") as f:
                await f.write(content)
            beat.mp3_path = str(mp3_path.relative_to(AUDIO_STORAGE))
            total_size += len(content)
    
            try:
                audio = MutagenFile(mp3_path)
                if audio is not None and hasattr(audio, 'info'):
                    beat.duration = round(audio.info.length, 2)
            except Exception as e:
                print(f"Ошибка при получении длительности MP3: {e}")

        if wav_file and wav_file.filename:
            wav_path = beat_folder / "audio.wav"
            content = await wav_file.read()
            async with aiofiles.open(wav_path, "wb") as f:
                await f.write(content)
            beat.wav_path = str(wav_path.relative_to(AUDIO_STORAGE))
            total_size += len(content)
            
            try:
                audio = MutagenFile(wav_path)
                if audio is not None and hasattr(audio, 'info'):
                    beat.duration = round(audio.info.length, 2)
            except Exception as e:
                print(f"Ошибка при получении длительности WAV: {e}")
                    
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



@router.get("/", response_model=List[BeatResponse], summary = "Получить все биты")
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


@router.get("/top-beatmakers", summary="Получить топ битмейкеров по количеству битов")
async def get_top_beatmakers(
    session: SessionDep,
    limit: int = 10
):
    from sqlalchemy.orm import selectinload
    from src.models.users import UsersModel

    # Получаем топ пользователей по количеству битов
    result = await session.execute(
        select(
            BeatModel.author_id,
            func.count(BeatModel.id).label('beat_count'),
            UsersModel.username,
            UsersModel.avatar_path
        )
        .join(UsersModel, BeatModel.author_id == UsersModel.id)
        .group_by(BeatModel.author_id, UsersModel.username, UsersModel.avatar_path)
        .order_by(func.count(BeatModel.id).desc())
        .limit(limit)
    )

    top_beatmakers = result.all()

    return [
        {
            "user_id": row.author_id,
            "username": row.username,
            "avatar_path": row.avatar_path,
            "beat_count": row.beat_count
        }
        for row in top_beatmakers
    ]


@router.get("/{beat_id}", response_model=BeatResponse, summary = "Получить бит по идентификатору")
async def get_beat(
    beat_id: int,
    session: SessionDep
):
    from sqlalchemy.orm import selectinload
    
    result = await session.execute(
        select(BeatModel)
        .options(selectinload(BeatModel.owner))
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




@router.post("/generate-identical/", summary="Создание 100 одинаковых битов")
async def generate_identical_beats(
    session: SessionDep,
    current_user_id: Annotated[int, Depends(get_current_user_id)],
    name: str = Form("Default Beat Name"),
    genre: str = Form("hip-hop"),
    tempo: int = Form(140),
    key: str = Form("C"),
    mp3_file: UploadFile = File(None),
    wav_file: UploadFile = File(None),
):
    try:
        if not mp3_file and not wav_file:
            raise HTTPException(status_code=400, detail="Необходимо загрузить хотя бы один файл (MP3 или WAV)")
        
        total_size = 0
        file_duration = 180.0
        
        mp3_content = None
        if mp3_file and mp3_file.filename:
            mp3_content = await mp3_file.read()
            total_size += len(mp3_content)
            
            temp_mp3_path = Path("temp_batch_audio.mp3")
            async with aiofiles.open(temp_mp3_path, "wb") as f:
                await f.write(mp3_content)
            
            try:
                audio_info = MutagenFile(str(temp_mp3_path))
                if audio_info and hasattr(audio_info, 'info'):
                    file_duration = audio_info.info.length
            except Exception as e:
                print(f"Ошибка получения длительности MP3: {e}")
            
            temp_mp3_path.unlink(missing_ok=True)

        wav_content = None
        if wav_file and wav_file.filename:
            wav_content = await wav_file.read()
            total_size += len(wav_content)
            
            if file_duration == 180.0:
                temp_wav_path = Path("temp_batch_audio.wav")
                async with aiofiles.open(temp_wav_path, "wb") as f:
                    await f.write(wav_content)
                
                try:
                    audio_info = MutagenFile(str(temp_wav_path))
                    if audio_info and hasattr(audio_info, 'info'):
                        file_duration = audio_info.info.length
                except Exception as e:
                    print(f"Ошибка получения длительности WAV: {e}")
                
                temp_wav_path.unlink(missing_ok=True)
        
        beats_to_create = []
        
        for i in range(1, 101):
            beat = BeatModel(
                name=f"{name} #{i}",
                author_id=current_user_id,
                mp3_path=None,
                wav_path=None,
                genre=genre,
                tempo=tempo, 
                key=key,   
                size=total_size,
                duration=file_duration,
                promotion_status="standard",
                status="active"
            )
            beats_to_create.append(beat)
        
        session.add_all(beats_to_create)
        await session.commit()
        

        for beat in beats_to_create:
            beat_folder = AUDIO_STORAGE / "beats" / str(beat.id)
            beat_folder.mkdir(parents=True, exist_ok=True)
            
            mp3_path = None
            wav_path = None
            

            if mp3_content:
                mp3_path = beat_folder / "audio.mp3"
                async with aiofiles.open(mp3_path, "wb") as f:
                    await f.write(mp3_content)
                beat.mp3_path = str(mp3_path.relative_to(AUDIO_STORAGE))
            

            if wav_content:
                wav_path = beat_folder / "audio.wav"
                async with aiofiles.open(wav_path, "wb") as f:
                    await f.write(wav_content)
                beat.wav_path = str(wav_path.relative_to(AUDIO_STORAGE))
        

        await session.commit()
        

        created_beats = []
        for beat in beats_to_create:
            created_beats.append({
                "id": beat.id,
                "name": beat.name,
                "folder": f"beats/{beat.id}",
                "mp3_path": beat.mp3_path,
                "wav_path": beat.wav_path
            })
        
        response_data = {
            "message": f"Успешно создано 100 битов",
            "details": {
                "name_template": name,
                "genre": genre,
                "tempo": tempo,
                "key": key,
                "file_size": total_size,
                "duration_seconds": round(file_duration, 2),
                "total_records": len(beats_to_create),
                "files_included": ["mp3" if mp3_content else None, "wav" if wav_content else None],
                "storage_path": str(AUDIO_STORAGE)
            },
            "created_beats": created_beats[:10]
        }
        
        return response_data
        
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при создании битов: {str(e)}")
    
    
