from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Depends, Request
from typing import Optional, List
from typing_extensions import Annotated
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload, joinedload
import os
import shutil
import json
import aiofiles
from mutagen import File as MutagenFile
from pathlib import Path
from src.database.deps import SessionDep
from src.models.beats import BeatModel, StatusType
from src.models.beat_pricing import BeatPricingModel
from src.models.terms_of_use import TermsOfUseModel
from src.models.tags import TagModel
from src.schemas.beats import BeatResponse
from src.dependencies.auth import get_current_user_id
from src.dependencies.services import AudioFingerprintServiceDep
from src.telegram_bot.bot import support_bot
from src.core.cache import cached
from src.services.RedisService import redis_service
from src.services.rate_limiter import check_rate_limit
from src.services.rate_limiter import RateLimiter
from PIL import Image
from io import BytesIO

router = APIRouter(prefix="/beats", tags=["Аудио файлы"])

AUDIO_STORAGE = Path("audio_storage")
AUDIO_STORAGE.mkdir(parents=True, exist_ok=True)

COVER_STORAGE = Path("static/covers")
COVER_STORAGE.mkdir(parents=True, exist_ok=True)

@router.post("/create", response_model=BeatResponse)
async def create_beat(
    request: Request,
    session: SessionDep,
    fingerprint_service: AudioFingerprintServiceDep,
    current_user_id: Annotated[int, Depends(get_current_user_id)],
    name: str = Form(...),
    genre: str = Form(...),
    tempo: int = Form(...),
    key: str = Form(...),
    promotion_status: str = Form("standard"),
    is_free: str = Form("false"),
    terms_of_use: str = Form(None),
    tags: str = Form(None),
    audio_file: UploadFile = File(None),
    cover_file: UploadFile = File(None),
):
    await check_rate_limit(request, "beat_create", current_user_id)

    if not audio_file:
        raise HTTPException(400, "Необходимо загрузить MP3 или WAV файл")

    beat = BeatModel(
        name=name,
        genre=genre,
        author_id=current_user_id,
        tempo=tempo,
        key=key,
        promotion_status=promotion_status,
        status=StatusType.MODERATED,
        audio_file_path=None,
        cover_path=None,
        size=0,
        duration=0.0,
        audio_fingerprint=None,
        audio_fingerprint_timings=None
    )
    
    session.add(beat)
    await session.flush()
    
    beat_folder = None
    audio_path_for_fingerprint = None
    
    try:
        rate_limiter = RateLimiter()
        await rate_limiter.increment_daily_beat_counter(current_user_id)
        beat_folder = AUDIO_STORAGE / "beats" / str(beat.id)
        beat_folder.mkdir(parents=True, exist_ok=True)
        total_size = 0
                
        if audio_file and audio_file.filename:
            file_ext = audio_file.filename.split('.')[-1].lower()
            if file_ext not in ['mp3', 'wav']:
                raise HTTPException(400, "Аудиофайл должен быть в формате MP3 или WAV")
            
            audio_filename = f"audio.{file_ext}"
            audio_path = beat_folder / audio_filename
            
            content = await audio_file.read()
            async with aiofiles.open(audio_path, "wb") as f:
                await f.write(content)
            
            beat.audio_file_path = str(audio_path.relative_to(AUDIO_STORAGE))
            total_size += len(content)
            audio_path_for_fingerprint = audio_path

            try:
                audio = MutagenFile(audio_path)
                if audio is not None and hasattr(audio, 'info'):
                    beat.duration = round(audio.info.length, 2)
            except Exception:
                pass
        
        beat.size = total_size

        if cover_file and cover_file.filename:
            allowed_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
            ext = cover_file.filename.lower().split('.')[-1]
            if f'.{ext}' not in allowed_extensions:
                raise HTTPException(400, "Обложка должна быть в формате JPG, PNG, WEBP или GIF")
            
            cover_content = await cover_file.read()
            if len(cover_content) > 5 * 1024 * 1024:
                raise HTTPException(400, "Размер обложки не должен превышать 5MB")
            
            try:
                image = Image.open(BytesIO(cover_content))
                width, height = image.size
                if width != height:
                    raise HTTPException(400, "Обложка должна быть квадратной")
            except HTTPException:
                raise
            except Exception:
                raise HTTPException(400, "Не удалось проверить обложку")
            
            cover_folder = COVER_STORAGE / str(beat.id)
            cover_folder.mkdir(parents=True, exist_ok=True)
            
            cover_filename = f"cover.{ext}"
            cover_path = cover_folder / cover_filename
            
            async with aiofiles.open(cover_path, "wb") as f:
                await f.write(cover_content)
            
            beat.cover_path = str(cover_path.relative_to(COVER_STORAGE))

        if audio_path_for_fingerprint:
            fingerprint, fingerprint_data = await fingerprint_service.extract_fingerprint(
                audio_path_for_fingerprint
            )
            
            if fingerprint != "0" * 16:
                from sqlalchemy import or_
                result = await session.execute(
                    select(BeatModel)
                    .where(BeatModel.audio_fingerprint.isnot(None))
                    .where(BeatModel.id != beat.id)
                    .where(
                        or_(
                            BeatModel.status == StatusType.AVAILABLE,
                            BeatModel.status == StatusType.MODERATED
                        )
                    )
                    .options(selectinload(BeatModel.owner))
                )
                existing_beats = result.scalars().all()
                
                duplicates = []
                for existing_beat in existing_beats:
                    is_match, similarity = fingerprint_service.compare_fingerprints(
                        fingerprint,
                        existing_beat.audio_fingerprint
                    )
                    
                    if is_match:
                        duplicates.append({
                            'beat_id': existing_beat.id,
                            'beat_name': existing_beat.name,
                            'author': existing_beat.owner.username if existing_beat.owner else 'Unknown',
                            'author_id': existing_beat.author_id,
                            'similarity': round(similarity, 4)
                        })
                        
                if duplicates:
                    duplicates.sort(key=lambda x: x['similarity'], reverse=True)
                    
                    if beat_folder.exists():
                        shutil.rmtree(beat_folder, ignore_errors=True)
                    
                    await session.rollback()
                
                    raise HTTPException(
                        status_code=409, 
                        detail={
                            "error": "duplicate_audio_found",
                            "message": "Жулик не воруй",
                            "duplicate_count": len(duplicates)
                        }
                    )
                
                beat.audio_fingerprint = fingerprint
                beat.audio_fingerprint_timings = json.dumps(fingerprint_data["timings"])

        if terms_of_use:
            try:
                terms_data = json.loads(terms_of_use)
                
                terms_of_use_model = TermsOfUseModel(
                    beat_id=beat.id,
                    recording_tracks=terms_data.get('recording_tracks', False),
                    commercial_perfomance=terms_data.get('commercial_perfomance', False),
                    rotation_on_the_radio=terms_data.get('rotation_on_the_radio', False),
                    music_video_recording=terms_data.get('music_video_recording', False),
                    release_of_copies=terms_data.get('release_of_copies', False)
                )
                session.add(terms_of_use_model)
                await session.flush()
            except json.JSONDecodeError:
                pass
            except Exception:
                pass

        if tags:
            try:
                tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
                tag_list = list(dict.fromkeys(tag_list))

                if len(tag_list) > 10:
                    raise HTTPException(400, "Максимум 10 тегов")

                for tag_name in tag_list:
                    if len(tag_name) > 50:
                        tag_name = tag_name[:50]

                    tag = TagModel(
                        beat_id=beat.id,
                        name=tag_name.lower()
                    )
                    session.add(tag)

                await session.flush()

            except HTTPException:
                raise
            except Exception:
                pass
        
        await session.commit()
        
        result = await session.execute(
            select(BeatModel)
            .where(BeatModel.id == beat.id)
            .options(
                selectinload(BeatModel.owner),
                selectinload(BeatModel.pricings).selectinload(BeatPricingModel.tariff),
                selectinload(BeatModel.terms_of_use_backref),
                selectinload(BeatModel.tags)
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
        if beat_with_relations.audio_file_path:
            audio_path = AUDIO_STORAGE / beat_with_relations.audio_file_path

        cover_path = None
        if beat_with_relations.cover_path:
            cover_path = COVER_STORAGE / beat_with_relations.cover_path

        import asyncio
        asyncio.create_task(
            support_bot.send_beat_moderation_notification(
                beat_data, 
                user_info, 
                str(audio_path) if audio_path else None,
                str(cover_path) if cover_path else None
            )
        )
        
        await redis_service.delete_pattern("*beats:*")
        
        return BeatResponse.model_validate(beat_with_relations)
        
    except HTTPException:
        raise
        
    except Exception as e:
        await session.rollback()
        if beat_folder and beat_folder.exists():
            shutil.rmtree(beat_folder, ignore_errors=True)
        raise HTTPException(500, f"Ошибка при создании бита: {str(e)}")

@router.get("/", response_model=List[BeatResponse])
@cached(ttl=300)
async def get_beats(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    author_id: Optional[int] = None,
    promotion_status: Optional[str] = None,
    tag: Optional[str] = Query(None, description="Фильтр по тегу")
):
    from src.models.favorite import FavoriteModel

    likes_subquery = select(func.count(FavoriteModel.id)).where(FavoriteModel.beat_id == BeatModel.id).scalar_subquery()

    query = select(BeatModel, likes_subquery.label('likes_count')).options(
        selectinload(BeatModel.owner),
        selectinload(BeatModel.pricings).joinedload(BeatPricingModel.tariff),
        selectinload(BeatModel.terms_of_use_backref),
        selectinload(BeatModel.tags)
    )

    if author_id is not None:
        query = query.where(BeatModel.author_id == author_id)
    else:
        query = query.where(BeatModel.status == StatusType.AVAILABLE)

    if promotion_status is not None:
        query = query.where(BeatModel.promotion_status == promotion_status)

    if tag:
        query = query.join(BeatModel.tags).where(TagModel.name == tag.lower())

    result = await session.execute(
        query
        .offset(skip)
        .limit(limit)
        .order_by(likes_subquery.desc())
    )

    beats_with_likes = result.unique().all()
    
    beats = []
    for beat, likes_count in beats_with_likes:
        beat.likes_count = likes_count
        beats.append(beat)
    
    return [BeatResponse.model_validate(beat) for beat in beats]

@router.get("/top-beatmakers")
@cached(ttl=600)
async def get_top_beatmakers(
    session: SessionDep,
    limit: int = 10
):
    from src.models.users import UsersModel
    from src.models.favorite import FavoriteModel

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

@router.get("/beatmakers")
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

@router.get("/moderation", response_model=List[BeatResponse], summary="Получить биты на модерации")
async def get_beats_for_moderation(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100
):
    result = await session.execute(
        select(BeatModel)
        .options(
            selectinload(BeatModel.owner),
            selectinload(BeatModel.pricings).selectinload(BeatPricingModel.tariff),
            selectinload(BeatModel.terms_of_use_backref),
            selectinload(BeatModel.tags)
        )
        .where(BeatModel.status == StatusType.MODERATED)
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
    result = await session.execute(
        select(BeatModel)
        .options(
            selectinload(BeatModel.owner),
            selectinload(BeatModel.terms_of_use_backref),
            selectinload(BeatModel.tags)
        )
        .where(BeatModel.id == beat_id)
    )
    
    beat = result.scalar_one_or_none()
    if not beat:
        raise HTTPException(404, "Бит не найден")
    
    return BeatResponse.model_validate(beat)

@router.get("/{beat_id}/stream")
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

    if not beat.audio_file_path:
        raise HTTPException(404, "Аудиофайл не найден")

    file_path = AUDIO_STORAGE / beat.audio_file_path
    
    if not os.path.exists(file_path):
        raise HTTPException(404, "Аудиофайл не найден на диске")

    file_ext = beat.audio_file_path.split('.')[-1].lower()
    if file_ext != format:
        raise HTTPException(400, f"Запрошен формат {format}, но доступен {file_ext}")

    if current_user_id != beat.author_id:
        from src.models.users import UsersModel
        
        author_result = await session.execute(
            select(UsersModel).where(UsersModel.id == beat.author_id)
        )
        author = author_result.scalar_one_or_none()
        
        if author:
            old_count = author.download_count or 0
            author.download_count = old_count + 1
            await session.commit()

    from fastapi.responses import FileResponse

    media_type = "audio/mpeg" if file_ext == "mp3" else "audio/wav"
    response = FileResponse(
        path=file_path,
        media_type=media_type,
        filename=f"{beat.name}.{file_ext}"
    )

    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"

    return response

@router.delete("/{beat_id}")
async def delete_beat(
    beat_id: int,
    session: SessionDep
):
    result = await session.execute(select(BeatModel).where(BeatModel.id == beat_id))
    beat = result.scalar_one_or_none()
    
    if not beat:
        raise HTTPException(404, "Бит не найден")
    
    beat_folder = AUDIO_STORAGE / "beats" / str(beat_id)
    if beat_folder.exists():
        shutil.rmtree(beat_folder, ignore_errors=True)
    
    cover_folder = COVER_STORAGE / str(beat_id)
    if cover_folder.exists():
        shutil.rmtree(cover_folder, ignore_errors=True)
    
    await session.delete(beat)
    await session.commit()
    
    return {"message": "Бит удален"}

@router.post("/generate-identical/")
async def generate_identical_beats(
    request: Request,
    session: SessionDep,
    current_user_id: Annotated[int, Depends(get_current_user_id)],
    name: str = Form("Default Beat Name"),
    genre: str = Form("hip-hop"),
    tempo: int = Form(140),
    key: str = Form("C"),
    audio_file: UploadFile = File(None),
):
    await check_rate_limit(request, "beat_create", current_user_id)
    
    try:
        if not audio_file:
            raise HTTPException(status_code=400, detail="Необходимо загрузить аудиофайл")

        file_ext = audio_file.filename.split('.')[-1].lower()
        if file_ext not in ['mp3', 'wav']:
            raise HTTPException(400, "Аудиофайл должен быть в формате MP3 или WAV")

        total_size = 0
        file_duration = 180.0

        audio_content = await audio_file.read()
        total_size += len(audio_content)

        temp_audio_path = Path(f"temp_batch_audio.{file_ext}")
        async with aiofiles.open(temp_audio_path, "wb") as f:
            await f.write(audio_content)

        try:
            audio_info = MutagenFile(str(temp_audio_path))
            if audio_info and hasattr(audio_info, 'info'):
                file_duration = audio_info.info.length
        except Exception:
            pass

        temp_audio_path.unlink(missing_ok=True)

        beats_to_create = []

        for i in range(1, 101):
            beat = BeatModel(
                name=f"{name} #{i}",
                author_id=current_user_id,
                audio_file_path=None,
                cover_path=None,
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

            audio_path = beat_folder / f"audio.{file_ext}"
            async with aiofiles.open(audio_path, "wb") as f:
                await f.write(audio_content)
            
            beat.audio_file_path = str(audio_path.relative_to(AUDIO_STORAGE))

        await session.commit()

        created_beats = []
        for beat in beats_to_create:
            created_beats.append({
                "id": beat.id,
                "name": beat.name,
                "folder": f"beats/{beat.id}",
                "audio_file_path": beat.audio_file_path
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
                "file_format": file_ext,
                "storage_path": str(AUDIO_STORAGE)
            },
            "created_beats": created_beats[:10]
        }

        return response_data

    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при создании битов: {str(e)}")

@router.post("/{beat_id}/favorite")
async def toggle_favorite(
    beat_id: int,
    session: SessionDep,
    current_user_id: Annotated[int, Depends(get_current_user_id)],
):
    from src.models.favorite import FavoriteModel

    result = await session.execute(select(BeatModel).where(BeatModel.id == beat_id))
    beat = result.scalar_one_or_none()

    if not beat:
        raise HTTPException(404, "Бит не найден")

    favorite_result = await session.execute(
        select(FavoriteModel).where(
            FavoriteModel.user_id == current_user_id,
            FavoriteModel.beat_id == beat_id
        )
    )
    existing_favorite = favorite_result.scalar_one_or_none()

    if existing_favorite:
        await session.delete(existing_favorite)
        await session.commit()
        return {"message": "Бит удален из избранного", "action": "removed"}
    else:
        favorite = FavoriteModel(
            user_id=current_user_id,
            beat_id=beat_id
        )
        session.add(favorite)
        await session.commit()
        return {"message": "Бит добавлен в избранное", "action": "added"}

@router.post("/{beat_id}/increment-download")
async def increment_download_count(
    beat_id: int,
    session: SessionDep,
    current_user_id: Annotated[int, Depends(get_current_user_id)],
):
    from src.models.users import UsersModel

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


@router.get("/moderation", response_model=List[BeatResponse], summary="Получить биты на модерации")
async def get_beats_for_moderation(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100
):
    result = await session.execute(
        select(BeatModel)
        .options(
            selectinload(BeatModel.owner),
            selectinload(BeatModel.pricings).selectinload(BeatPricingModel.tariff),
            selectinload(BeatModel.terms_of_use_backref),
            selectinload(BeatModel.tags)
        )
        .where(BeatModel.status == StatusType.MODERATED)
        .offset(skip)
        .limit(limit)
        .order_by(BeatModel.created_at.desc())
    )
    
    beats = result.scalars().all()
    return [BeatResponse.model_validate(beat) for beat in beats]


@router.post("/{beat_id}/approve", summary="Одобрить бит")
async def approve_beat(
    beat_id: int,
    session: SessionDep,
    current_user_id: Annotated[int, Depends(get_current_user_id)]
):
    from src.models.users import UsersModel
    
    user_result = await session.execute(
        select(UsersModel).where(UsersModel.id == current_user_id)
    )
    user = user_result.scalar_one_or_none()
    
    if not user or user.role != 'admin':
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    result = await session.execute(
        select(BeatModel).where(BeatModel.id == beat_id)
    )
    beat = result.scalar_one_or_none()
    
    if not beat:
        raise HTTPException(status_code=404, detail="Бит не найден")
    
    if beat.status != StatusType.MODERATED:
        raise HTTPException(status_code=400, detail="Бит уже был обработан")
    
    await session.execute(
        update(BeatPricingModel)
        .where(
            BeatPricingModel.beat_id == beat_id,
            BeatPricingModel.tariff_name.in_(['leasing', 'exclusive'])
        )
        .values(price=BeatPricingModel.price + 200)
    )
    
    beat.status = StatusType.AVAILABLE
    await session.commit()
    await redis_service.delete_pattern("*beats*")
    
    return {"success": True, "message": f"Бит '{beat.name}' одобрен и опубликован"}


@router.post("/{beat_id}/reject", summary="Отклонить бит")
async def reject_beat(
    beat_id: int,
    session: SessionDep,
    current_user_id: Annotated[int, Depends(get_current_user_id)],
    reason: str = Form(..., description="Причина отклонения")
):
    from src.models.users import UsersModel
    
    user_result = await session.execute(
        select(UsersModel).where(UsersModel.id == current_user_id)
    )
    user = user_result.scalar_one_or_none()
    
    if not user or user.role != 'admin':
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    result = await session.execute(
        select(BeatModel).where(BeatModel.id == beat_id)
    )
    beat = result.scalar_one_or_none()
    
    if not beat:
        raise HTTPException(status_code=404, detail="Бит не найден")
    
    if beat.status != StatusType.MODERATED:
        raise HTTPException(status_code=400, detail="Бит уже был обработан")
    
    beat.status = StatusType.DENIED
    beat.rejection_reason = reason
    await session.commit()
    await redis_service.delete_pattern("*beats*")
    
    return {"success": True, "message": f"Бит '{beat.name}' отклонен", "reason": reason}
