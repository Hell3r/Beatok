import React, { useMemo, useState } from 'react';
import { useTrail, animated } from '@react-spring/web';
import { useNavigate } from 'react-router-dom';
import type { Beat } from '../../../types/Beat';
import { truncateText } from '../../../utils/truncateText';
import { formatDuration } from '../../../utils/formatDuration';
import { getAvatarUrl } from '../../../utils/getAvatarURL';
import { getCurrentUser } from '../../../utils/getCurrentUser';
import { apiUrl } from '../../../services/api';
import type { Filters } from './Filter';
import BeatPurchaseModal from '../../BeatPurchaseModal';
import BeatPromotionModal from '../../BeatPromotionModal';
import BeatInfoModal from '../../BeatInfoModal';
import RoleBadge from '../RoleBadge';

interface BeatListProps {
  beats: Beat[];
  loading?: boolean;
  currentPlayingBeat?: Beat | null;
  isPlaying?: boolean;
  onPlay?: (beat: Beat) => void;
  onDownload?: (beat: Beat) => void;
  isProfileView?: boolean;
  filters: Filters;
  onToggleFavorite?: (beat: Beat) => void;
  favoriteBeats?: Beat[];
  onDeleteBeat?: (beat: Beat) => void;
  onShowRejectionReason?: (beat: Beat) => void;
  maxColumns?: number;
}

const BeatList: React.FC<BeatListProps> = ({
  beats,
  loading = false,
  currentPlayingBeat = null,
  isPlaying = false,
  onPlay,
  onDownload,
  isProfileView = false,
  filters,
  onToggleFavorite,
  favoriteBeats = [],
  onDeleteBeat,
  onShowRejectionReason,
  maxColumns = 5,
}) => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [beatToPurchase, setBeatToPurchase] = useState<Beat | null>(null);
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);
  const [beatToPromote, setBeatToPromote] = useState<Beat | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [beatToShowInfo, setBeatToShowInfo] = useState<Beat | null>(null);

  const isFree = (beat: Beat): boolean => {
    if (!beat.pricings || beat.pricings.length === 0) return true;
    const availablePrices = beat.pricings.filter(
      (pricing) => pricing.price !== null && pricing.is_available,
    );
    if (availablePrices.length === 0) return true;
    return Math.min(...availablePrices.map((pricing) => pricing.price!)) === 0;
  };

  const getBeatMinPrice = (beat: Beat): number | null => {
    if (!beat.pricings || beat.pricings.length === 0) return null;
    const availablePrices = beat.pricings.filter(
      (pricing) => pricing.price !== null && pricing.is_available,
    );
    if (availablePrices.length === 0) return null;
    return Math.min(...availablePrices.map((pricing) => pricing.price!));
  };

  const getAuthorName = (beat: Beat): string => {
    if (beat.owner?.username) return beat.owner.username;
    if (beat.author?.username) return beat.author.username;
    if (beat.user?.username) return beat.user.username;
    if (beat.author_id) return `Пользователь ${beat.author_id}`;
    return 'Неизвестно';
  };

  const getAuthorId = (beat: Beat): number | null => {
    if (beat.owner?.id) return beat.owner.id;
    if (beat.author?.id) return beat.author.id;
    if (beat.user?.id) return beat.user.id;
    return beat.author_id || null;
  };

  const getAuthorRole = (beat: Beat): string | undefined => {
    if (beat.owner?.role) return beat.owner.role;
    if (beat.author?.role) return beat.author.role;
    if (beat.user?.role) return beat.user.role;
    return undefined;
  };

  const getAuthorAvatar = (beat: Beat): string => {
    const authorId = getAuthorId(beat);
    if (!authorId) return apiUrl('/static/default_avatar.png');
    if (beat.owner?.avatar_path) return getAvatarUrl(authorId, beat.owner.avatar_path);
    if (beat.author?.avatar_path) return getAvatarUrl(authorId, beat.author.avatar_path);
    if (beat.user?.avatar_path) return getAvatarUrl(authorId, beat.user.avatar_path);
    return apiUrl('/static/default_avatar.png');
  };

  const getCoverUrl = (beat: Beat): string | null => {
    if (!beat.cover_path) return null;
    if (beat.cover_path.startsWith('http')) return beat.cover_path;
    if (beat.cover_path.startsWith('/static/')) return apiUrl(beat.cover_path);
    if (beat.cover_path.startsWith('static/')) return apiUrl(`/${beat.cover_path}`);
    return apiUrl(`/static/covers/${beat.cover_path}`);
  };

  const getStatusLabel = (beat: Beat) => {
    if (beat.status === 'available') return 'Доступен';
    if (beat.status === 'moderated') return 'На модерации';
    return 'Отклонен';
  };

  const getStatusClassName = (beat: Beat) => {
    if (beat.status === 'available') {
      return 'border-emerald-400/[0.18] bg-emerald-500/[0.14] text-emerald-100';
    }
    if (beat.status === 'moderated') {
      return 'border-white/10 bg-white/[0.06] text-white';
    }
    return 'border-red-500/[0.18] bg-red-500/[0.16] text-red-100';
  };

  const filteredBeats = useMemo(() => {
    if (!Array.isArray(beats)) return [];

    return beats.filter((beat) => {
      if (!isProfileView && beat.status !== 'available') {
        return false;
      }

      if (filters.name) {
        const searchLower = filters.name.toLowerCase();
        const nameMatch = beat.name.toLowerCase().includes(searchLower);
        const tagMatch = beat.tags?.some((tag) => tag.name.toLowerCase().includes(searchLower));
        if (!nameMatch && !tagMatch) return false;
      }

      if (
        filters.author &&
        !getAuthorName(beat).toLowerCase().includes(filters.author.toLowerCase())
      ) {
        return false;
      }

      if (filters.genre && !beat.genre.toLowerCase().includes(filters.genre.toLowerCase())) {
        return false;
      }

      if (filters.bpm && !beat.tempo.toString().includes(filters.bpm)) {
        return false;
      }

      if (filters.key && beat.key !== filters.key) {
        return false;
      }

      if (!isProfileView && filters.freeOnly && !isFree(beat)) {
        return false;
      }

      if (!isProfileView && !filters.freeOnly) {
        const beatMinPrice = getBeatMinPrice(beat);

        if (filters.minPrice) {
          const minPrice = parseFloat(filters.minPrice);
          if (beatMinPrice === null || beatMinPrice < minPrice) {
            return false;
          }
        }

        if (filters.maxPrice) {
          const maxPrice = parseFloat(filters.maxPrice);
          if (beatMinPrice === null || beatMinPrice > maxPrice) {
            return false;
          }
        }
      }

      return true;
    });
  }, [beats, filters, isProfileView]);

  const sortedBeats = useMemo(() => {
    return [...filteredBeats].sort((a, b) => {
      const aIsPromoted = a.promotion_status !== 'standard';
      const bIsPromoted = b.promotion_status !== 'standard';

      if (aIsPromoted && !bIsPromoted) return -1;
      if (!aIsPromoted && bIsPromoted) return 1;

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filteredBeats]);

  const trail = useTrail(sortedBeats.length, {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { duration: 90 },
  });

  const gridClassName =
    maxColumns >= 6
      ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'
      : maxColumns >= 5
        ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
        : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  const handleAuthorClick = (beat: Beat) => {
    const authorId = getAuthorId(beat);
    if (authorId) {
      navigate(`/profile/${authorId}`);
    }
  };

  const handleOpenPurchase = (beat: Beat) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }

    setBeatToPurchase(beat);
    setPurchaseModalOpen(true);
  };

  if (loading) {
    return (
      <div className={gridClassName}>
        {[...Array(8)].map((_, index) => (
          <div key={index} className="glass-card animate-pulse p-3">
            <div className="mb-3 aspect-[16/10] rounded-[22px] bg-white/[0.07]" />
            <div className="mb-3 h-5 w-3/4 rounded-full bg-white/[0.07]" />
            <div className="mb-4 h-4 w-1/2 rounded-full bg-white/[0.06]" />
            <div className="mb-4 grid grid-cols-2 gap-2">
              {[...Array(4)].map((__, cellIndex) => (
                <div key={cellIndex} className="h-9 rounded-2xl bg-white/[0.06]" />
              ))}
            </div>
            <div className="flex gap-2">
              <div className="h-11 flex-1 rounded-full bg-white/[0.07]" />
              <div className="h-11 w-11 rounded-full bg-white/[0.07]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sortedBeats.length === 0) {
    return (
      <div className="glass-panel-strong px-6 py-12 text-center">
        <p className="text-sm uppercase tracking-[0.28em] text-neutral-500">No match</p>
        <h3 className="mt-3 text-2xl font-bold text-white">По этим фильтрам пока пусто</h3>
        <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-400">
          Попробуйте ослабить условия поиска, убрать часть фильтров или переключиться на другую
          категорию.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={gridClassName}>
        {trail.map((style, index) => {
          const beat = sortedBeats[index];
          const isOwnBeat = Boolean(currentUser && getAuthorId(beat) === currentUser.id);
          const coverUrl = getCoverUrl(beat);
          const minPrice = getBeatMinPrice(beat);
          const isFavorite = favoriteBeats.some((favoriteBeat) => favoriteBeat.id === beat.id);
          const isCurrentBeat = currentPlayingBeat?.id === beat.id && isPlaying;
          const displayTags = beat.tags?.slice(0, 2) ?? [];

          return (
            <animated.article key={beat.id} style={style} className="glass-card group relative p-3">
              <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
                <div className="absolute left-[-10%] top-[-12%] h-28 w-28 rounded-full bg-red-500/20 blur-3xl" />
                <div className="absolute bottom-[-14%] right-[-8%] h-32 w-32 rounded-full bg-orange-300/10 blur-3xl" />
              </div>

              <div className="relative z-10 flex h-full flex-col">
                <div className="relative mb-3">
                  <div className="absolute left-2.5 top-2.5 z-10 flex flex-wrap gap-2">
                    {beat.promotion_status === 'promoted' && (
                      <span className="glass-pill border-yellow-400/20 bg-yellow-300/[0.22] text-[10px] font-semibold uppercase tracking-[0.24em] text-yellow-50">
                        Top
                      </span>
                    )}
                    {isCurrentBeat && (
                      <span className="glass-pill border-red-500/20 bg-red-500/[0.18] text-[10px] font-semibold uppercase tracking-[0.24em] text-red-50">
                        Live
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const token = localStorage.getItem('access_token');
                      if (!token) {
                        window.dispatchEvent(new CustomEvent('openAuthModal'));
                        return;
                      }
                      onToggleFavorite?.(beat);
                    }}
                    className={`hidden absolute right-2.5 top-2.5 z-10 h-11 w-11 items-center justify-center rounded-full border transition ${
                      isFavorite
                        ? 'border-red-500/25 bg-red-500/[0.16] text-red-300'
                        : 'border-white/10 bg-black/30 text-white/80 hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white'
                    }`}
                    title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                  >
                    <svg
                      className="h-8 w-8"
                      fill={isFavorite ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className={`beat-cover relative block w-full overflow-hidden rounded-[24px] border border-white/[0.08] bg-black/30 text-left ${
                      isCurrentBeat ? 'beat-cover--active' : ''
                    }`}
                    onClick={() => onPlay?.(beat)}
                    title={isCurrentBeat ? 'Пауза' : 'Воспроизвести'}
                  >
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={`Обложка ${beat.name}`}
                        className="beat-cover-image aspect-[16/10] w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex aspect-[16/10] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),rgba(255,255,255,0.03)_45%,rgba(0,0,0,0.45))]">
                        <svg className="h-12 w-12 text-white/[0.45]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="beat-cover-dim absolute inset-0 bg-black/45" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_34%,rgba(0,0,0,0.52)_100%)]" />

                    <div
                      className={`beat-cover-play absolute inset-0 z-[1] flex items-center justify-center ${
                        isCurrentBeat ? 'beat-cover-play--visible' : ''
                      } ${isCurrentBeat ? 'text-red-300' : 'text-white'}`}
                    >
                      {isCurrentBeat ? (
                        <svg className="h-9 w-9 drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                        </svg>
                      ) : (
                        <svg className="ml-1 h-11 w-11 drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </div>

                  </button>
                </div>

                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      className="text-left text-base font-semibold leading-tight text-white transition group-hover:text-red-300"
                      title={beat.name}
                      onClick={() => {
                        setBeatToShowInfo(beat);
                        setInfoModalOpen(true);
                      }}
                    >
                      {truncateText(beat.name, 24)}
                    </button>

                    <button
                      type="button"
                      className="mt-2.5 flex items-center gap-2 text-sm text-neutral-300 transition hover:text-white"
                      onClick={() => handleAuthorClick(beat)}
                      title={`Перейти в профиль ${getAuthorName(beat)}`}
                    >
                      <img
                        src={getAuthorAvatar(beat)}
                        alt={`Аватар ${getAuthorName(beat)}`}
                        className="h-8 w-8 rounded-full border border-white/10 object-cover"
                        onError={(event) => {
                          event.currentTarget.src = apiUrl('/static/default_avatar.png');
                        }}
                      />
                      <span className="truncate">{getAuthorName(beat)}</span>
                      <RoleBadge role={getAuthorRole(beat)} showLabel={true} className="ml-1" />
                    </button>
                  </div>

                  {isProfileView && (
                    <button
                      type="button"
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusClassName(beat)} ${
                        beat.status === 'denied' && beat.rejection_reason ? 'cursor-pointer' : 'cursor-default'
                      }`}
                      onClick={() => {
                        if (beat.status === 'denied' && beat.rejection_reason) {
                          onShowRejectionReason?.(beat);
                        }
                      }}
                      title={
                        beat.status === 'denied' && beat.rejection_reason
                          ? 'Нажмите для просмотра причины'
                          : ''
                      }
                    >
                      {getStatusLabel(beat)}
                    </button>
                  )}
                </div>

                <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-neutral-200">
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2">
                    <span className="block text-[10px] uppercase tracking-[0.22em] text-neutral-500">Жанр</span>
                    <span className="mt-1 block truncate" title={beat.genre}>
                      {truncateText(beat.genre, 16)}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2">
                    <span className="block text-[10px] uppercase tracking-[0.22em] text-neutral-500">Темп</span>
                    <span className="mt-1 block">{beat.tempo} BPM</span>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2">
                    <span className="block text-[10px] uppercase tracking-[0.22em] text-neutral-500">Тональность</span>
                    <span className="mt-1 block truncate">{beat.key || 'Нет'}</span>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2">
                    <span className="block text-[10px] uppercase tracking-[0.22em] text-neutral-500">Длина</span>
                    <span className="mt-1 block">{formatDuration(beat.duration)}</span>
                  </div>
                </div>


                {isProfileView && beat.status === 'available' && beat.promotion_status !== 'promoted' && (
                  <button
                    type="button"
                    onClick={() => {
                      setBeatToPromote(beat);
                      setPromotionModalOpen(true);
                    }}
                    className="mb-3 flex w-full items-center justify-center gap-2 rounded-[18px] border border-yellow-400/20 bg-gradient-to-r from-yellow-300/[0.82] via-yellow-400/[0.72] to-amber-400/[0.78] px-4 py-3 text-sm font-semibold text-black transition hover:brightness-105"
                    title="Продвигать бит"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span>Продвинуть бит • 200 ₽</span>
                  </button>
                )}

                <div className="mt-auto space-y-3">
                  <div className="flex items-stretch gap-2">
                    {isOwnBeat ? (
                      <button
                        type="button"
                        onClick={() => onDownload?.(beat)}
                        className="beat-card-action action-button-secondary action-button-block flex-1"
                        title="Скачать"
                      >
                        Скачать
                      </button>
                    ) : isFree(beat) ? (
                      <button
                        type="button"
                        onClick={() => onDownload?.(beat)}
                        className="beat-card-action action-button-secondary action-button-block flex-1"
                        title="Скачать"
                      >
                        Скачать
                        <span className="beat-free-badge rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em]">
                          Free
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenPurchase(beat)}
                        className="beat-card-action action-button-primary action-button-block flex-1"
                        title="Купить"
                      >
                        {minPrice !== null ? `от ${minPrice.toLocaleString('ru-RU')} ₽` : 'Купить'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const token = localStorage.getItem('access_token');
                        if (!token) {
                          window.dispatchEvent(new CustomEvent('openAuthModal'));
                          return;
                        }
                        onToggleFavorite?.(beat);
                      }}
                      className={`beat-card-action flex h-12 w-12 shrink-0 items-center justify-center rounded-full border px-0 transition ${
                        isFavorite
                          ? 'border-red-500/25 bg-red-500/[0.16] text-red-300'
                          : 'border-white/10 bg-black/30 text-white/75 hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white'
                      }`}
                      title={isFavorite ? 'РЈР±СЂР°С‚СЊ РёР· РёР·Р±СЂР°РЅРЅРѕРіРѕ' : 'Р”РѕР±Р°РІРёС‚СЊ РІ РёР·Р±СЂР°РЅРЅРѕРµ'}
                    >
                      <svg
                        className="h-10 w-10"
                        fill={isFavorite ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>

                    {isProfileView && onDeleteBeat && (
                      <button
                        type="button"
                        onClick={() => onDeleteBeat(beat)}
                        className="rounded-full border border-red-500/[0.16] bg-red-500/10 px-4 py-2.5 text-sm text-red-100 transition hover:border-red-500/[0.24] hover:bg-red-500/[0.16]"
                      >
                        Удалить
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-neutral-500">
                    {new Date(beat.created_at).toLocaleDateString('ru-RU')}
                  </div>

                </div>
              </div>
            </animated.article>
          );
        })}
      </div>

      <BeatPurchaseModal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        beat={beatToPurchase}
      />

      <BeatPromotionModal
        isOpen={promotionModalOpen}
        onClose={() => setPromotionModalOpen(false)}
        beat={beatToPromote}
        onPromoteSuccess={() => {
          setPromotionModalOpen(false);
          setBeatToPromote(null);
          window.dispatchEvent(new CustomEvent('beatsUpdated'));
        }}
      />

      <BeatInfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        beat={beatToShowInfo}
      />
    </>
  );
};

export default BeatList;
