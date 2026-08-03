import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Beat } from '../../../types/Beat';
import { truncateText } from '../../../utils/truncateText';
import { formatDuration } from '../../../utils/formatDuration';
import { getAvatarUrl } from '../../../utils/getAvatarURL';
import type { Filters } from './Filter';
import ContextMenu from '../ContextMenu';
import DeleteBeatModal from '../../DeleteBeatModal';
import BeatPurchaseModal from '../../BeatPurchaseModal';
import BeatPromotionModal from '../../BeatPromotionModal';
import BeatInfoModal from '../../BeatInfoModal';
import { getCurrentUser } from '../../../utils/getCurrentUser';
import RoleBadge from '../RoleBadge';
import { apiUrl } from '../../../services/api';

const getCoverUrl = (beat: Beat): string | null => {
  if (!beat.cover_path) return null;
  return apiUrl(`/static/covers/${beat.cover_path}`);
};

const getAudioFormat = (beat: Beat): string => {
  if (!beat.audio_file_path) return '';
  return beat.audio_file_path.split('.').pop()?.toUpperCase() || '';
};

interface BeatTableProps {
  beats: Beat[];
  loading?: boolean;
  currentPlayingBeat?: Beat | null;
  isPlaying?: boolean;
  onPlay?: (beat: Beat) => void;
  onDownload?: (beat: Beat) => void;
  filters: Filters;
  isProfileView?: boolean;
  hideAuthorColumn?: boolean;
  onShowRejectionReason?: (beat: Beat) => void;
  onDeleteBeat?: (beat: Beat) => void;
  onToggleFavorite?: (beat: Beat) => void;
  favoriteBeats?: Beat[];
}

const BeatTable: React.FC<BeatTableProps> = ({
  beats,
  loading = false,
  currentPlayingBeat = null,
  isPlaying = false,
  onPlay,
  onDownload,
  filters,
  isProfileView = false,
  hideAuthorColumn = false,
  onShowRejectionReason,
  onDeleteBeat,
  onToggleFavorite,
  favoriteBeats = [],
}) => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<keyof Beat>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; beat: Beat } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [beatToDelete, setBeatToDelete] = useState<Beat | null>(null);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [beatToPurchase, setBeatToPurchase] = useState<Beat | null>(null);
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);
  const [beatToPromote, setBeatToPromote] = useState<Beat | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [beatToShowInfo, setBeatToShowInfo] = useState<Beat | null>(null);

  const isFree = (beat: Beat): boolean => {
    if (!beat.pricings || beat.pricings.length === 0) return true;
    const availablePrices = beat.pricings.filter((p) => p.price !== null && p.is_available);
    if (availablePrices.length === 0) return true;
    return Math.min(...availablePrices.map((p) => p.price!)) === 0;
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

  const getAuthorAvatar = (beat: Beat): string => {
    const authorId = getAuthorId(beat);
    if (!authorId) return apiUrl('/static/default_avatar.png');
    if (beat.owner?.avatar_path) return getAvatarUrl(authorId, beat.owner.avatar_path);
    if (beat.author?.avatar_path) return getAvatarUrl(authorId, beat.author.avatar_path);
    if (beat.user?.avatar_path) return getAvatarUrl(authorId, beat.user.avatar_path);
    return apiUrl('/static/default_avatar.png');
  };

  const getAuthorRole = (beat: Beat): string | undefined => {
    if (beat.owner?.role) return beat.owner.role;
    if (beat.author?.role) return beat.author.role;
    if (beat.user?.role) return beat.user.role;
    return undefined;
  };

  const handleAuthorClick = (beat: Beat) => {
    const authorId = getAuthorId(beat);
    if (authorId) {
      navigate(`/profile/${authorId}`);
    }
  };

  const getBeatMinPrice = (beat: Beat): number | null => {
    if (!beat.pricings || beat.pricings.length === 0) return null;
    const availablePrices = beat.pricings.filter((p) => p.price !== null && p.is_available);
    if (availablePrices.length === 0) return null;
    return Math.min(...availablePrices.map((p) => p.price!));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
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
      if (!isProfileView && filters.author && !getAuthorName(beat).toLowerCase().includes(filters.author.toLowerCase())) {
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
      if (!isProfileView && filters.freeOnly) {
        if (!isFree(beat)) return false;
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
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'created_at' || sortField === 'updated_at') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      if ((aValue ?? Number.MIN_SAFE_INTEGER) < (bValue ?? Number.MIN_SAFE_INTEGER)) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if ((aValue ?? Number.MIN_SAFE_INTEGER) > (bValue ?? Number.MIN_SAFE_INTEGER)) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredBeats, sortField, sortDirection]);

  const handleSort = (field: keyof Beat) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon: React.FC<{ field: keyof Beat }> = ({ field }) => {
    if (sortField !== field) {
      return <span className="text-[10px] text-[var(--text-muted)]">↕</span>;
    }
    return <span className="text-[10px] text-red-300">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const handleContextMenu = (e: React.MouseEvent, beat: Beat) => {
    if (!isProfileView) return;
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      beat,
    });
  };

  const handleDeleteClick = () => {
    if (contextMenu) {
      setBeatToDelete(contextMenu.beat);
      setDeleteModalOpen(true);
      setContextMenu(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (beatToDelete) {
      onDeleteBeat?.(beatToDelete);
      setDeleteModalOpen(false);
      setBeatToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setBeatToDelete(null);
  };

  const handlePromoteClick = (beat?: Beat) => {
    const targetBeat = beat || (contextMenu ? contextMenu.beat : null);
    if (targetBeat) {
      setBeatToPromote(targetBeat);
      setPromotionModalOpen(true);
      setContextMenu(null);
    }
  };

  const handlePromoteSuccess = () => {
    setPromotionModalOpen(false);
    setBeatToPromote(null);
    window.dispatchEvent(new CustomEvent('beatsUpdated'));
  };

  const renderActions = (beat: Beat) => {
    const currentUser = getCurrentUser();
    const isOwnBeat = currentUser && getAuthorId(beat) === currentUser.id;
    const isFavorite = favoriteBeats.some((fav) => fav.id === beat.id);
    const minPrice = beat.pricings?.filter((p) => p.price !== null && p.is_available).map((p) => p.price!);

    if (isProfileView) {
      return (
        <td className="px-4 py-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${beat.status === 'available' ? 'border-emerald-400/25 bg-emerald-400/12 text-emerald-200' : beat.status === 'moderated' ? 'border-white/12 bg-white/6 text-white' : 'border-red-500/30 bg-red-500/12 text-red-200'} ${beat.status === 'denied' ? 'cursor-pointer hover:bg-red-500/18' : ''}`}
              onClick={() => beat.status === 'denied' && beat.rejection_reason && onShowRejectionReason?.(beat)}
              title={beat.status === 'denied' && beat.rejection_reason ? 'Нажмите для просмотра причины' : ''}
            >
              {beat.status === 'available' ? 'Доступен' : beat.status === 'moderated' ? 'На модерации' : 'Отклонен'}
            </span>

            {beat.status === 'available' && beat.promotion_status !== 'promoted' && (
              <button
                onClick={() => handlePromoteClick(beat)}
                className="flex items-center gap-2 rounded-full border border-yellow-400/30 bg-[linear-gradient(135deg,rgba(250,204,21,0.96),rgba(202,138,4,0.92))] px-3 py-2 text-sm font-semibold text-black shadow-[0_14px_28px_rgba(234,179,8,0.18)] transition duration-300 hover:-translate-y-0.5"
                title="Продвигать бит"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>Продвинуть</span>
              </button>
            )}
          </div>
        </td>
      );
    }

    return (
      <td className="px-4 py-4 text-center">
        <div className="flex justify-center gap-2">
          {isOwnBeat ? (
            <button
              onClick={() => onDownload?.(beat)}
              className="rounded-full border border-white/12 bg-white/6 px-5 py-2.5 text-sm font-medium text-white transition duration-300 hover:border-white/20 hover:bg-white/10"
              style={{ minWidth: '120px' }}
              title="Скачать"
            >
              Скачать
            </button>
          ) : isFree(beat) ? (
            <button
              onClick={() => onDownload?.(beat)}
              className="rounded-full border border-white/12 bg-white/6 px-5 py-2.5 text-sm font-medium text-white transition duration-300 hover:border-white/20 hover:bg-white/10"
              style={{ minWidth: '120px' }}
              title="Скачать"
            >
              Скачать
            </button>
          ) : (
            <button
              onClick={() => {
                const token = localStorage.getItem('access_token');
                if (!token) {
                  window.dispatchEvent(new CustomEvent('openAuthModal'));
                  return;
                }
                setBeatToPurchase(beat);
                setPurchaseModalOpen(true);
              }}
              className="rounded-full border border-red-500/30 bg-[linear-gradient(135deg,rgba(220,38,38,0.95),rgba(127,29,29,0.92))] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(220,38,38,0.22)] transition duration-300 hover:-translate-y-0.5"
              style={{ minWidth: '120px' }}
              title="Купить"
            >
              от {Math.min(...(minPrice || [0]))} ₽
            </button>
          )}

          <button
            onClick={() => {
              const token = localStorage.getItem('access_token');
              if (!token) {
                window.dispatchEvent(new CustomEvent('openAuthModal'));
                return;
              }
              onToggleFavorite?.(beat);
            }}
            className={`flex h-12 w-12 items-center justify-center rounded-full border transition duration-300 ${isFavorite ? 'border-red-500/30 bg-red-500/12 text-red-400 shadow-[0_0_24px_rgba(220,38,38,0.18)]' : 'border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10'}`}
            title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
          >
            <svg className="h-6 w-6" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </td>
    );
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[rgba(15,18,28,0.84)] shadow-[0_24px_60px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8 bg-white/4 text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
              <th className="px-4 py-4 text-center">Обложка</th>
              <th className="px-4 py-4 text-center">Название</th>
              {!isProfileView && !hideAuthorColumn && <th className="px-4 py-4 text-center">Автор</th>}
              <th className="px-4 py-4 text-center">Жанр</th>
              <th className="px-4 py-4 text-center">Темп</th>
              <th className="px-4 py-4 text-center">Тон</th>
              <th className="px-4 py-4 text-center">Длина</th>
              <th className="hidden px-4 py-4 text-center md:table-cell">Размер</th>
              <th className="hidden px-4 py-4 text-center md:table-cell">Дата</th>
              <th className="px-4 py-4 text-center">Действия</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-white/6 animate-pulse">
                <td className="px-4 py-4"><div className="mx-auto h-16 w-16 rounded-2xl bg-white/8" /></td>
                <td className="px-4 py-4"><div className="mx-auto h-4 w-3/4 rounded-full bg-white/8" /></td>
                {!isProfileView && !hideAuthorColumn && <td className="px-4 py-4"><div className="mx-auto h-4 w-2/3 rounded-full bg-white/8" /></td>}
                <td className="px-4 py-4"><div className="mx-auto h-4 w-1/2 rounded-full bg-white/8" /></td>
                <td className="px-4 py-4"><div className="mx-auto h-4 w-1/3 rounded-full bg-white/8" /></td>
                <td className="px-4 py-4"><div className="mx-auto h-4 w-1/3 rounded-full bg-white/8" /></td>
                <td className="px-4 py-4"><div className="mx-auto h-4 w-1/3 rounded-full bg-white/8" /></td>
                <td className="hidden px-4 py-4 md:table-cell"><div className="mx-auto h-4 w-1/2 rounded-full bg-white/8" /></td>
                <td className="hidden px-4 py-4 md:table-cell"><div className="mx-auto h-4 w-2/3 rounded-full bg-white/8" /></td>
                <td className="px-4 py-4"><div className="mx-auto h-10 w-full rounded-full bg-white/8" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,18,28,0.94),rgba(10,12,18,0.96))] shadow-[0_24px_60px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px]">
            <thead>
              <tr className="border-b border-white/8 bg-white/4 text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                <th className="px-4 py-4 text-center">Обложка</th>
                <th className="px-4 py-4 text-center">
                  <button className="flex w-full items-center justify-center gap-2" onClick={() => handleSort('name')}>
                    <span>Название бита</span>
                    <SortIcon field="name" />
                  </button>
                </th>
                {!isProfileView && !hideAuthorColumn && (
                  <th className="px-4 py-4 text-center">
                    <button className="flex w-full items-center justify-center gap-2" onClick={() => handleSort('owner')}>
                      <span>Автор</span>
                      <SortIcon field="owner" />
                    </button>
                  </th>
                )}
                <th className="px-4 py-4 text-center">
                  <button className="flex w-full items-center justify-center gap-2" onClick={() => handleSort('genre')}>
                    <span>Жанр</span>
                    <SortIcon field="genre" />
                  </button>
                </th>
                <th className="px-4 py-4 text-center">
                  <button className="flex w-full items-center justify-center gap-2" onClick={() => handleSort('tempo')}>
                    <span>Темп</span>
                    <SortIcon field="tempo" />
                  </button>
                </th>
                <th className="px-4 py-4 text-center">
                  <button className="flex w-full items-center justify-center gap-2" onClick={() => handleSort('key')}>
                    <span>Тон</span>
                    <SortIcon field="key" />
                  </button>
                </th>
                <th className="px-4 py-4 text-center">
                  <button className="flex w-full items-center justify-center gap-2" onClick={() => handleSort('duration')}>
                    <span>Длина</span>
                    <SortIcon field="duration" />
                  </button>
                </th>
                <th className="hidden px-4 py-4 text-center md:table-cell">
                  <button className="flex w-full items-center justify-center gap-2" onClick={() => handleSort('size')}>
                    <span>Размер</span>
                    <SortIcon field="size" />
                  </button>
                </th>
                <th className="hidden px-4 py-4 text-center md:table-cell">
                  <button className="flex w-full items-center justify-center gap-2" onClick={() => handleSort('created_at')}>
                    <span>Дата создания</span>
                    <SortIcon field="created_at" />
                  </button>
                </th>
                <th className="px-4 py-4 text-center">{isProfileView ? 'Статус' : 'Действия'}</th>
              </tr>
            </thead>
            <tbody>
              {sortedBeats.map((beat) => {
                const coverUrl = getCoverUrl(beat);
                const audioFormat = getAudioFormat(beat);

                return (
                  <tr
                    key={beat.id}
                    className="border-b border-white/6 transition duration-300 hover:bg-white/4"
                    onContextMenu={(e) => handleContextMenu(e, beat)}
                  >
                    <td className="px-4 py-4 text-center">
                      <div className="relative mx-auto w-fit">
                        {beat.promotion_status === 'promoted' && (
                          <div className="absolute -left-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-yellow-400/25 bg-yellow-400/12 text-yellow-200">
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                            </svg>
                          </div>
                        )}

                        <button
                          className={`group relative h-16 w-16 overflow-hidden rounded-[20px] border border-white/10 bg-white/5 ${beat.promotion_status === 'promoted' ? 'shadow-[0_0_0_1px_rgba(250,204,21,0.18)]' : ''}`}
                          onClick={() => onPlay?.(beat)}
                        >
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt="Обложка"
                              className={`h-full w-full object-cover transition duration-500 ${
                                currentPlayingBeat?.id === beat.id && isPlaying
                                  ? 'scale-105 brightness-[0.58]'
                                  : 'group-hover:scale-105 group-hover:brightness-[0.58]'
                              }`}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-white/6">
                              <svg className="h-5 w-5 text-white/35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                              </svg>
                            </div>
                          )}
                          <div className={`absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(4,6,10,0.26),rgba(4,6,10,0.82))] transition duration-300 ${currentPlayingBeat?.id === beat.id && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/10 text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                            {currentPlayingBeat?.id === beat.id && isPlaying ? (
                              <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                              </svg>
                            ) : (
                              <svg className="h-6 w-6 translate-x-0.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            )}
                            </div>
                          </div>
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <button
                        className="text-center text-base font-semibold text-white transition duration-300 hover:text-red-300"
                        title={beat.name}
                        onClick={() => {
                          setBeatToShowInfo(beat);
                          setInfoModalOpen(true);
                        }}
                      >
                        {truncateText(beat.name, 20)}
                      </button>

                      <div className="mt-2 flex items-center justify-center gap-2">
                        {audioFormat && (
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.22em] ${audioFormat === 'WAV' ? 'border-sky-400/25 bg-sky-400/12 text-sky-200' : 'border-emerald-400/25 bg-emerald-400/12 text-emerald-200'}`}>
                            {audioFormat}
                          </span>
                        )}
                      </div>
                    </td>

                    {!isProfileView && !hideAuthorColumn && (
                      <td className="px-4 py-4 text-center">
                        <div
                          className="inline-flex cursor-pointer flex-col items-center gap-1 text-[var(--text-secondary)] transition duration-300 hover:text-white"
                          onClick={() => handleAuthorClick(beat)}
                          title={`Перейти к профилю ${getAuthorName(beat)}`}
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={getAuthorAvatar(beat)}
                              alt="Аватар автора"
                              className="h-7 w-7 rounded-full border border-white/10 object-cover"
                              onError={(e) => {
                                e.currentTarget.src = apiUrl('/static/default_avatar.png');
                              }}
                            />
                            <span>{truncateText(getAuthorName(beat), 15)}</span>
                          </div>
                          <RoleBadge role={getAuthorRole(beat)} showLabel={true} className="mt-1" />
                        </div>
                      </td>
                    )}

                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-sm text-white">
                        {beat.genre}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-mono text-sm text-white/90">{beat.tempo} BPM</td>
                    <td className="px-4 py-4 text-center font-mono text-sm text-white/90">{beat.key}</td>
                    <td className="px-4 py-4 text-center text-sm text-white/90">{formatDuration(beat.duration)}</td>
                    <td className="hidden px-4 py-4 text-center text-sm text-[var(--text-secondary)] md:table-cell">{formatFileSize(beat.size)}</td>
                    <td className="hidden px-4 py-4 text-center text-sm text-[var(--text-secondary)] md:table-cell">{formatDate(beat.created_at)}</td>
                    {renderActions(beat)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredBeats.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <svg className="mb-4 h-12 w-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-lg text-white">Биты не найдены</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onDelete={handleDeleteClick}
          onPromote={handlePromoteClick}
          onClose={() => setContextMenu(null)}
        />
      )}

      <DeleteBeatModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        beatName={beatToDelete?.name || ''}
      />

      <BeatPurchaseModal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        beat={beatToPurchase}
      />

      <BeatPromotionModal
        isOpen={promotionModalOpen}
        onClose={() => setPromotionModalOpen(false)}
        beat={beatToPromote}
        onPromoteSuccess={handlePromoteSuccess}
      />

      <BeatInfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        beat={beatToShowInfo}
      />
    </>
  );
};

export default BeatTable;
