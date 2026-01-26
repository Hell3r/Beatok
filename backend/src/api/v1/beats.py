from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Depends, Request
from typing import Optional, List
from typing_extensions import Annotated
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
import os
import shutil
import aiofiles
from mutagen import File as MutagenFile
from pathlib import Path
from src.database.deps import SessionDep
from src.models.beats import BeatModel, StatusType
from src.models.beat_bricing import BeatPricingModel
from src.schemas.beats import BeatResponse, BeatListResponse
from src.services.AuthService import get_current_user
from src.dependencies.auth import get_current_user_id
from src.telegram_bot.bot import support_bot
from src.core.cache import cached
from src.services.RedisService import redis_service
from pathlib import Path
from src.services.rate_limiter import check_rate_limit


router = APIRouter(prefix="/beats", tags=["Аудио файлы"])

AUDIO_STORAGE = Path("audio_storage")
AUDIO_STORAGE.mkdir(parents=True, exist_ok=True)

@router.post("/create", response_model=BeatResponse, summary = "Добавить файл")
async def create_beat(
    request: Request,
    session: SessionDep,
    current_user_id: Annotated[int, Depends(get_current_user_id)],
    name: str = Form(...),
    genre: str = Form(...),
    tempo: int = Form(...),
    key: str = Form(...),
    promotion_status: str = Form("standard"),
    status: str = Form("active"),
    is_free: str = Form("false"),
    mp3_file: UploadFile = File(None),
    wav_file: UploadFile = File(None),
):
    await check_rate_limit(request, "beat_create", current_user_id)
    
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
        status=StatusType.MODERATED,
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
            .options(
                selectinload(BeatModel.owner),
                selectinload(BeatModel.pricings).selectinload(BeatPricingModel.tariff)
            )
        )
        beat_with_relations = result.scalar_one()

        user_info = {
            'id': beat_with_relations.owner.id,
            'username': beat_with_relations.owner.username,
            'email': beat_with_relations.owner.email
        }

        beat_data = {
            'id': beat_with_relations.id,
            'name': beat_with_relations.name,
            'genre': beat_with_relations.genre,
            'tempo': beat_with_relations.tempo,
            'key': beat_with_relations.key,
            'promotion_status': beat_with_relations.promotion_status
        }

        audio_path = None
        if beat_with_relations.mp3_path:
            audio_path = AUDIO_STORAGE / beat_with_relations.mp3_path
        elif beat_with_relations.wav_path:
            audio_path = AUDIO_STORAGE / beat_with_relations.wav_path

        if is_free.lower() == "true":
            import asyncio
            asyncio.create_task(
                support_bot.send_beat_moderation_notification(beat_data, user_info, str(audio_path) if audio_path else None)
            )
        
        print("🔄 Начинаем очистку кеша...")
        success = await redis_service.delete_pattern("*beats:*")
        if success:
            print("✅ Кеш успешно очищен")
        else:
            print("❌ Не удалось очистить кеш")
        return BeatResponse.model_validate(beat_with_relations)
        
    except Exception as e:
        await session.rollback()
        beat_folder = AUDIO_STORAGE / "beats" / str(beat.id)
        if beat_folder.exists():
            shutil.rmtree(beat_folder, ignore_errors=True)
        raise HTTPException(500, f"Ошибка: {str(e)}")




@router.get("/", response_model=List[BeatResponse], summary = "Получить все биты")
@cached(ttl=300)
async def get_beats(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    author_id: Optional[int] = None,
    promotion_status: Optional[str] = None
):
    from sqlalchemy.orm import selectinload
    from src.models.favorite import FavoriteModel

    likes_subquery = select(func.count(FavoriteModel.id)).where(FavoriteModel.beat_id == BeatModel.id).scalar_subquery()

    query = select(BeatModel, likes_subquery.label('likes_count')).options(
        selectinload(BeatModel.owner),
        selectinload(BeatModel.pricings).joinedload(BeatPricingModel.tariff)
    )

    if author_id is not None:
        query = query.where(BeatModel.author_id == author_id)

    if promotion_status is not None:
        query = query.where(BeatModel.promotion_status == promotion_status)

    result = await session.execute(
        query
        .offset(skip)
        .limit(limit)
        .order_by(likes_subquery.desc())
    )

    beats_with_likes = result.unique().all()
    for beat, likes_count in beats_with_likes:
        beat.likes_count = likes_count
    beats = [beat for beat, _ in beats_with_likes]
    return [BeatResponse.model_validate(beat) for beat in beats]


@router.get("/top-beatmakers", summary="Получить топ битмейкеров по количеству лайков на их битах")
@cached(ttl=600)
async def get_top_beatmakers(
    session: SessionDep,
    limit: int = 10
):
    from sqlalchemy.orm import selectinload
    from src.models.users import UsersModel
    from src.models.favorite import FavoriteModel

    # Subquery to calculate total likes per author
    total_likes_subquery = select(
        BeatModel.author_id,
        func.sum(
            select(func.count(FavoriteModel.id)).where(FavoriteModel.beat_id == BeatModel.id).scalar_subquery()
        ).label('total_likes')
    ).where(BeatModel.status == StatusType.AVAILABLE).group_by(BeatModel.author_id).subquery()

    result = await session.execute(
        select(
            UsersModel,
            total_likes_subquery.c.total_likes,
            func.count(BeatModel.id).label('beat_count')
        )
        .join(total_likes_subquery, total_likes_subquery.c.author_id == UsersModel.id)
        .join(BeatModel, BeatModel.author_id == UsersModel.id)
        .where(BeatModel.status == StatusType.AVAILABLE)
        .group_by(UsersModel.id, UsersModel.username, UsersModel.avatar_path, total_likes_subquery.c.total_likes)
        .order_by(total_likes_subquery.c.total_likes.desc())
        .limit(limit)
    )

    top_beatmakers = result.all()

    return [
        {
            "user_id": row[0].id,
            "username": row[0].username,
            "avatar_path": row[0].avatar_path,
            "total_likes": row[1] or 0,
            "beat_count": row[2]
        }
        for row in top_beatmakers
    ]


@router.get("/beatmakers", summary="Получить всех битмейкеров (пользователей с хотя бы одним битом)")
@cached(ttl=600)
async def get_all_beatmakers(
    session: SessionDep
):
    from src.models.users import UsersModel
    
    
    result = await session.execute(
        select(
            BeatModel.author_id,
            func.count(BeatModel.id).label('beat_count'),
            UsersModel.username,
            UsersModel.avatar_path,
            UsersModel.email,
            UsersModel.birthday,
            UsersModel.is_active,
            UsersModel.role
        )
        .join(UsersModel, BeatModel.author_id == UsersModel.id)
        .group_by(
            BeatModel.author_id,
            UsersModel.username,
            UsersModel.avatar_path,
            UsersModel.email,
            UsersModel.birthday,
            UsersModel.is_active,
            UsersModel.role
        )
        .having(func.count(BeatModel.id) >= 1)
        .order_by(func.count(BeatModel.id).desc())
    )

    beatmakers = result.all()

    return [
        {
            "id": row.author_id,
            "username": row.username,
            "email": row.email,
            "birthday": row.birthday,
            "is_active": row.is_active,
            "role": row.role,
            "avatar_path": row.avatar_path,
            "beat_count": row.beat_count
        }
        for row in beatmakers
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
    session: SessionDep,
    beat_id: int,
    current_user_id: Annotated[int, Depends(get_current_user_id)],
    format: str = Query("mp3", regex="^(mp3|wav)$"),
):
    result = await session.execute(select(BeatModel).where(BeatModel.id == beat_id))
    beat = result.scalar_one_or_none()

    if not beat:
        raise HTTPException(404, "Бит не найден")

    file_path = beat.mp3_path if format == "mp3" else beat.wav_path

    if not file_path or not os.path.exists(file_path):
        raise HTTPException(404, "Аудиофайл не найден")

    if current_user_id != beat.author_id:
        from src.models.users import UsersModel
        
        author_result = await session.execute(
            select(UsersModel).where(UsersModel.id == beat.author_id)
        )
        author = author_result.scalar_one_or_none()
        
        print(f"🔍 Author found: {author is not None}")
        print(f"🔍 Current download_count: {author.download_count if author else 'No author'}")
    
        if author:
            old_count = author.download_count
            author.download_count = 1 if author.download_count is None else author.download_count + 1
            await session.commit()
            await session.refresh(author)  # Обновляем чтобы увидеть изменения
            print(f"🔍 Download count updated: {old_count} -> {author.download_count}")

    from fastapi.responses import FileResponse

    media_type = "audio/mpeg" if format == "mp3" else "audio/wav"
    response = FileResponse(
        path=file_path,
        media_type=media_type,
        filename=f"{beat.name}.{format}"
    )

    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"

    return response


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
    request: Request,
    session: SessionDep,
    current_user_id: Annotated[int, Depends(get_current_user_id)],
    name: str = Form("Default Beat Name"),
    genre: str = Form("hip-hop"),
    tempo: int = Form(140),
    key: str = Form("C"),
    mp3_file: UploadFile = File(None),
    wav_file: UploadFile = File(None),
):
    
    await check_rate_limit(request, "beat_create", current_user_id)
    
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
                status=StatusType.MODERATED
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
    
    

@router.post("/{beat_id}/favorite", summary="Добавить/удалить бит из избранного")
async def toggle_favorite(
    beat_id: int,
    session: SessionDep,
    current_user_id: Annotated[int, Depends(get_current_user_id)],
):
    from src.models.favorite import FavoriteModel
    from src.models.beats import BeatModel

    # Проверяем, существует ли бит
    result = await session.execute(select(BeatModel).where(BeatModel.id == beat_id))
    beat = result.scalar_one_or_none()

    if not beat:
        raise HTTPException(404, "Бит не найден")

    # Проверяем, есть ли уже в избранном
    favorite_result = await session.execute(
        select(FavoriteModel).where(
            FavoriteModel.user_id == current_user_id,
            FavoriteModel.beat_id == beat_id
        )
    )
    existing_favorite = favorite_result.scalar_one_or_none()

    if existing_favorite:
        # Удаляем из избранного
        await session.delete(existing_favorite)
        await session.commit()
        return {"message": "Бит удален из избранного", "action": "removed"}
    else:
        # Добавляем в избранное
        favorite = FavoriteModel(
            user_id=current_user_id,
            beat_id=beat_id
        )
        session.add(favorite)
        await session.commit()
        return {"message": "Бит добавлен в избранное", "action": "added"}


@router.post("/{beat_id}/increment-download", summary="Увеличить счетчик скачиваний")
async def increment_download_count(
    beat_id: int,
    session: SessionDep,
    current_user_id: Annotated[int, Depends(get_current_user_id)],
):
    from src.models.users import UsersModel
    from src.models.beats import BeatModel

    result = await session.execute(select(BeatModel).where(BeatModel.id == beat_id))
    beat = result.scalar_one_or_none()

    if not beat:
        raise HTTPException(404, "Бит не найден")

    if current_user_id != beat.author_id:
        author_result = await session.execute(
            select(UsersModel).where(UsersModel.id == beat.author_id)
        )
        author = author_result.scalar_one_or_none()

        if author:
            old_count = author.download_count or 0
            author.download_count = old_count + 1
            await session.commit()

            return {
                "success": True,
                "message": "Счетчик скачиваний увеличен",
                "new_count": author.download_count
            }

    return {"success": True, "message": "Автор не может увеличить свой счетчик"}
