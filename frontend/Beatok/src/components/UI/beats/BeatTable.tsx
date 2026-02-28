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

const getCoverUrl = (beat: Beat): string | null => {
  if (!beat.cover_path) return null;
  return `http://localhost:8000/static/covers/${beat.cover_path}`;
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
  const [expandedBeatId, setExpandedBeatId] = useState<number | null>(null);
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
    const availablePrices = beat.pricings.filter(p => p.price !== null && p.is_available);
    if (availablePrices.length === 0) return true;
    return Math.min(...availablePrices.map(p => p.price!)) === 0;
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
    if (!authorId) return 'http://localhost:8000/static/default_avatar.png';

    if (beat.owner?.avatar_path) return getAvatarUrl(authorId, beat.owner.avatar_path);
    if (beat.author?.avatar_path) return getAvatarUrl(authorId, beat.author.avatar_path);
    if (beat.user?.avatar_path) return getAvatarUrl(authorId, beat.user.avatar_path);

    return 'http://localhost:8000/static/default_avatar.png';
  };

  const handleAuthorClick = (beat: Beat) => {
    const authorId = getAuthorId(beat);
    if (authorId) {
      navigate(`/profile/${authorId}`);
    }
  };

  const getBeatMinPrice = (beat: Beat): number | null => {
    if (!beat.pricings || beat.pricings.length === 0) return null;
    const availablePrices = beat.pricings.filter(p => p.price !== null && p.is_available);
    if (availablePrices.length === 0) return null;
    return Math.min(...availablePrices.map(p => p.price!));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredBeats = useMemo(() => {
    return beats.filter((beat) => {
      if (!isProfileView && beat.status !== 'available') {
        return false;
      }
      if (filters.name) {
        const searchLower = filters.name.toLowerCase();
        const nameMatch = beat.name.toLowerCase().includes(searchLower);
        
        const tagMatch = beat.tags?.some(tag => 
          tag.name.toLowerCase().includes(searchLower)
        );

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
        const isBeatFree = isFree(beat);
        if (!isBeatFree) return false;
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

      if ((aValue ?? Number.MIN_SAFE_INTEGER) < (bValue ?? Number.MIN_SAFE_INTEGER))
          return sortDirection === 'asc' ? -1 : 1;
      if ((aValue ?? Number.MIN_SAFE_INTEGER) > (bValue ?? Number.MIN_SAFE_INTEGER))
          return sortDirection === 'asc' ? 1 : -1;
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
    if (sortField !== field) return <span>↕</span>;
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
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
    const beatToPromote = beat || (contextMenu ? contextMenu.beat : null);
    if (beatToPromote) {
      setBeatToPromote(beatToPromote);
      setPromotionModalOpen(true);
      setContextMenu(null);
    }
  };

  const handlePromoteConfirm = async (beatId: number) => {
    console.log('Promoting beat:', beatId);
    setPromotionModalOpen(false);
    setBeatToPromote(null);
  };

  const renderActions = (beat: Beat) => {
    const currentUser = getCurrentUser();
    const isOwnBeat = currentUser && getAuthorId(beat) === currentUser.id;

    if (isProfileView) {
      return (
        <td className="p-4 text-center">
          <div className="flex flex-col items-center space-y-2">
            <span
              className={`px-3 py-2 rounded text-sm font-medium select-none ${
                beat.status === 'available'
                  ? 'bg-green-600 text-white'
                  : beat.status === 'moderated'
                  ? 'bg-neutral-950 text-white'
                  : beat.status === 'denied'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-red-600 text-white'
              } ${beat.status === 'denied' ? 'cursor-pointer' : ''}`}
              onClick={() => beat.status === 'denied' && beat.rejection_reason && onShowRejectionReason?.(beat)}
              title={beat.status === 'denied' && beat.rejection_reason ? 'Нажмите для просмотра причины' : ''}
            >
              {beat.status === 'available' ? 'Доступен' : beat.status === 'moderated' ? 'На модерации' : 'Отклонён'}
            </span>
            <div className="flex space-x-1">
              {beat.status === 'available' && (
                <button
                  onClick={() => handlePromoteClick(beat)}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold px-3 py-2 rounded-lg transition-all duration-300 cursor-pointer flex items-center space-x-2 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                  title="Продвигать бит"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="text-sm select-none">Продвинуть</span>
                </button>
              )}
            </div>
          </div>
        </td>
      );
    } else {
      return (
        <td className="p-4 text-center">
          <div className="flex justify-center space-x-2">
            {isOwnBeat ? (
              <button
                onClick={() => onDownload?.(beat)}
                className="bg-neutral-700 hover:bg-neutral-600 text-white px-6 py-2 rounded-full transition-colors cursor-pointer"
                style={{ minWidth: '120px' }}
                title="Скачать"
              >
                Скачать
              </button>
            ) : isFree(beat) ? (
              <button
                onClick={() => onDownload?.(beat)}
                className="bg-neutral-700 hover:bg-neutral-600 text-white px-6 py-2 rounded-full transition-colors cursor-pointer relative"
                style={{ minWidth: '120px' }}
                title="Скачать"
              >
                Скачать
                <div className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-1 py-0.5 rounded">
                  Бесплатно
                </div>
              </button>
            ) : (
              <button
                onClick={() => {
                  setBeatToPurchase(beat);
                  setPurchaseModalOpen(true);
                }}
                className="bg-red-500 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-full transition-colors cursor-pointer"
                style={{ minWidth: '120px' }}
                title="Купить"
              >
                от {Math.min(...beat.pricings!.filter(p => p.price !== null && p.is_available).map(p => p.price!))} ₽
              </button>
            )}
            <button
              onClick={() => {
                const token = localStorage.getItem('access_token');
                if (!token) {
                  const event = new CustomEvent('openAuthModal');
                  window.dispatchEvent(event);
                  return;
                }
                onToggleFavorite?.(beat);
              }}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                favoriteBeats.some(fav => fav.id === beat.id) ? 'text-red-500' : 'text-white hover:bg-neutral-700'
              }`}
              title={favoriteBeats.some(fav => fav.id === beat.id) ? 'Убрать из избранного' : 'Добавить в избранное'}
            >
              <svg className="w-6 h-5" fill={favoriteBeats.some(fav => fav.id === beat.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </td>
      );
    }
  };

  if (loading) {
    return (
      <div className="bg-neutral-900 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-900">
              <th className="p-4 text-center">Обложка</th>
              <th className="p-4 text-center">Название</th>
              {!isProfileView && !hideAuthorColumn && (
                <th className="p-4 text-center">Автор</th>
              )}
              <th className="p-4 text-center">Жанр</th>
              <th className="p-4 text-center">Темп</th>
              <th className="p-4 text-center">Тональность</th>
              <th className="p-4 text-center">Длительность</th>
              <th className="p-4 text-center hidden md:table-cell">Размер</th>
              <th className="p-4 text-center hidden md:table-cell">Дата создания</th>
              <th className="p-4 text-center">Действия</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-neutral-700 animate-pulse">
                <td className="p-4"><div className="w-10 h-10 bg-neutral-700 rounded mx-auto"></div></td>
                <td className="p-4"><div className="h-4 bg-neutral-700 rounded mx-auto w-3/4"></div></td>
                {!isProfileView && !hideAuthorColumn && (
                  <td className="p-4"><div className="h-4 bg-neutral-700 rounded mx-auto w-2/3"></div></td>
                )}
                <td className="p-4"><div className="h-4 bg-neutral-700 rounded mx-auto w-1/2"></div></td>
                <td className="p-4"><div className="h-4 bg-neutral-700 rounded mx-auto w-1/4"></div></td>
                <td className="p-4"><div className="h-4 bg-neutral-700 rounded mx-auto w-1/4"></div></td>
                <td className="p-4"><div className="h-4 bg-neutral-700 rounded mx-auto w-1/4"></div></td>
                <td className="p-4"><div className="h-4 bg-neutral-700 rounded mx-auto w-1/3"></div></td>
                <td className="p-4"><div className="h-4 bg-neutral-700 rounded mx-auto w-2/3"></div></td>
                <td className="p-4"><div className="h-8 bg-neutral-700 rounded mx-auto w-full"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <div className="bg-neutral-900 rounded-lg overflow-hidden border border-neutral-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-900">
                <th className="p-4 text-center text-white font-semibold">
                  Обложка
                </th>
                <th
                  className="p-4 text-center text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span>Название бита</span>
                    <SortIcon field="name" />
                  </div>
                </th>
                {!isProfileView && !hideAuthorColumn && (
                  <th
                    className="p-4 text-center text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors"
                    onClick={() => handleSort('owner')}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span>Автор</span>
                      <SortIcon field="owner" />
                    </div>
                  </th>
                )}
                <th
                  className="p-4 text-center text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors md:table-cell"
                  onClick={() => handleSort('genre')}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span>Жанр</span>
                    <SortIcon field="genre" />
                  </div>
                </th>
                <th
                  className="p-4 text-center text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors md:table-cell"
                  onClick={() => handleSort('tempo')}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span>Темп</span>
                    <SortIcon field="tempo" />
                  </div>
                </th>
                <th
                  className="p-4 text-center text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors md:table-cell"
                  onClick={() => handleSort('key')}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span>Тон</span>
                    <SortIcon field="key" />
                  </div>
                </th>
                <th
                  className="p-4 text-center text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors md:table-cell"
                  onClick={() => handleSort('duration')}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span>Длина</span>
                    <SortIcon field="duration" />
                  </div>
                </th>
                <th
                  className="p-4 text-center text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors hidden md:table-cell"
                  onClick={() => handleSort('size')}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span>Размер</span>
                    <SortIcon field="size" />
                  </div>
                </th>
                <th
                  className="p-4 text-center text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors hidden md:table-cell"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span>Дата создания</span>
                    <SortIcon field="created_at" />
                  </div>
                </th>
                <th className="p-4 text-center text-white font-semibold">
                  {isProfileView ? 'Статус' : 'Действия'}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedBeats.map((beat) => (
                <tr
                  key={beat.id}
                  className={`border-b border-neutral-800 hover:bg-neutral-800 transition-all duration-300 group ${beat.status === 'denied' ? 'cursor-select' : ''}`}
                  onDoubleClick={() => setExpandedBeatId(expandedBeatId === beat.id ? null : beat.id)}
                  onContextMenu={(e) => handleContextMenu(e, beat)}
                >
                  <td className="p-4 text-center">
                    <div 
                      className={`relative w-16 h-16 rounded overflow-hidden mx-auto cursor-pointer group ${beat.promotion_status !== 'standard' ? 'p-0.5 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600' : ''}`}
                      onClick={() => onPlay?.(beat)}
                    >
                      {getCoverUrl(beat) ? (
                        <img
                          src={getCoverUrl(beat)!}
                          alt="Обложка"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
                          <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                        </div>
                      )}
                      <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200 ${currentPlayingBeat?.id === beat.id && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {currentPlayingBeat?.id === beat.id && isPlaying ? (
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div
                      className="text-white font-medium group-hover:text-red-400 transition-colors cursor-pointer"
                      title={beat.name}
                      onClick={() => {
                        setBeatToShowInfo(beat);
                        setInfoModalOpen(true);
                      }}
                    >
                      {truncateText(beat.name, 25)}
                    </div>
                    <div className="hidden md:flex items-center justify-center space-x-1 mt-1">
                      {isProfileView && beat.promotion_status !== 'standard' && (
                        <span className={`text-xs px-1 rounded select-none ${
                          beat.promotion_status === 'featured'
                            ? 'bg-red-600 text-white'
                            : 'bg-yellow-500 text-black'
                        }`}>
                        </span>
                      )}
                      {beat.wav_path && (
                        <span className="text-xs bg-blue-600 text-white px-1 rounded" title="Доступен WAV (высокое качество)">
                          WAV
                        </span>
                      )}
                      {!beat.wav_path && beat.mp3_path && (
                        <span className="text-xs bg-green-600 text-white px-1 rounded" title="MP3">
                          MP3
                        </span>
                      )}
                    </div>
                  </td>
                  {!isProfileView && !hideAuthorColumn && (
                    <td className="p-4 text-neutral-300 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <img
                          src={getAuthorAvatar(beat)}
                          alt="Аватар автора"
                          className="w-6 h-6 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'http://localhost:8000/static/default_avatar.png';
                          }}
                        />
                        <span
                          className="cursor-pointer hover:text-red-400 transition-colors"
                          onClick={() => handleAuthorClick(beat)}
                          title={`Перейти к профилю ${getAuthorName(beat)}`}
                        >
                          {truncateText(getAuthorName(beat), 15)}
                        </span>
                      </div>
                    </td>
                  )}
                  <td className="p-4 text-center">
                    <span className="bg-neutral-700 text-neutral-300 px-3 py-2 rounded text-sm min-w-[80px] inline-block">
                      {beat.genre}
                    </span>
                  </td>
                  <td className="p-4 text-neutral-300 font-mono text-center">
                    {beat.tempo} BPM
                  </td>
                  <td className="p-4 text-neutral-300 font-mono text-center">
                    {beat.key}
                  </td>
                  <td className="p-4 text-neutral-300 text-center">
                    {formatDuration(beat.duration)}
                  </td>
                  <td className="p-4 text-neutral-300 text-sm hidden md:table-cell text-center">
                    {formatFileSize(beat.size)}
                  </td>
                  <td className="p-4 text-neutral-400 text-sm hidden md:table-cell text-center">
                    {formatDate(beat.created_at)}
                  </td>
                  {renderActions(beat)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBeats.length === 0 && !loading && (
          <div className="text-center py-12 text-neutral-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-neutral-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-lg">Биты не найдены</p>
            <p className="text-sm">Попробуйте изменить параметры поиска</p>
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
        onPromote={handlePromoteConfirm}
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
