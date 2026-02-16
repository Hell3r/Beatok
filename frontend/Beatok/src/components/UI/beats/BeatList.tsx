import React, { useMemo, useState } from 'react';
import { useTrail, animated } from '@react-spring/web';
import { useNavigate } from 'react-router-dom';
import type { Beat } from '../../../types/Beat';
import { truncateText } from '../../../utils/truncateText';
import { formatDuration } from '../../../utils/formatDuration';
import { getAvatarUrl } from '../../../utils/getAvatarURL';
import { getCurrentUser } from '../../../utils/getCurrentUser';
import type { Filters } from './Filter';
import BeatPurchaseModal from '../../BeatPurchaseModal';
import BeatPromotionModal from '../../BeatPromotionModal';

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
}) => {
  const navigate = useNavigate();
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [beatToPurchase, setBeatToPurchase] = useState<Beat | null>(null);
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);
  const [beatToPromote, setBeatToPromote] = useState<Beat | null>(null);
  const currentUser = getCurrentUser();

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

  const filteredBeats = useMemo(() => {
    return beats.filter((beat) => {
      if (!isProfileView && beat.status !== 'available') {
        return false;
      }
      if (filters.name && !beat.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }
      if (filters.author && !getAuthorName(beat).toLowerCase().includes(filters.author.toLowerCase())) {
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

  const trail = useTrail(filteredBeats.length, {
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { duration: 300 },
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-neutral-800 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-neutral-700 rounded mb-3"></div>
            <div className="h-3 bg-neutral-700 rounded w-2/3 mb-4"></div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-3 bg-neutral-700 rounded"></div>
              ))}
            </div>
            <div className="h-1 bg-neutral-700 rounded mb-3"></div>
            <div className="flex justify-between">
              <div className="h-8 w-8 bg-neutral-700 rounded-full"></div>
              <div className="h-3 w-12 bg-neutral-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {trail.map((style, index) => {
          const beat = filteredBeats[index];
          const isOwnBeat = currentUser && getAuthorId(beat) === currentUser.id;
          return (
            <animated.div key={beat.id} style={style} className="bg-neutral-900 rounded-lg p-4 hover:bg-neutral-800 transition-all duration-300 group border border-neutral-700 relative">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3
                    className="text-white font-semibold text-lg group-hover:text-red-400 transition-colors"
                    title={beat.name}
                  >
                    {truncateText(beat.name, 25)}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <img
                      src={getAuthorAvatar(beat)}
                      alt="Аватар автора"
                      className="w-5 h-5 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'http://localhost:8000/static/default_avatar.png';
                      }}
                    />
                    <p
                      className="text-neutral-400 text-sm truncate cursor-pointer hover:text-red-400 transition-colors"
                      onClick={() => handleAuthorClick(beat)}
                      title={`Перейти в профиль ${getAuthorName(beat)}`}
                    >
                      by {getAuthorName(beat)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-1">
                  {isProfileView && (
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
                  )}
                  {isProfileView && beat.promotion_status !== 'standard' && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      beat.promotion_status === 'featured'
                        ? 'bg-red-600 text-white'
                        : 'bg-yellow-600 text-black'
                    }`}>
                    </span>
                  )}
                  {beat.wav_path && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full" title="Доступен WAV (высокое качество)">
                      WAV
                    </span>
                  )}
                  {!beat.wav_path && beat.mp3_path && (
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full" title="MP3">
                      MP3
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div className="text-neutral-300 truncate" title={beat.genre}>
                  <span className="text-neutral-500">Жанр:</span> {truncateText(beat.genre, 12)}
                </div>
                <div className="text-neutral-300">
                  <span className="text-neutral-500">Темп:</span> {beat.tempo} BPM
                </div>
                <div className="text-neutral-300 truncate" title={beat.key}>
                  <span className="text-neutral-500">Тональность:</span> {beat.key}
                </div>
                <div className="text-neutral-300">
                  <span className="text-neutral-500">Длина:</span> {formatDuration(beat.duration)}
                </div>
              </div>

              {/* Promote button - positioned prominently */}
              {isProfileView && beat.status === 'available' && (
                <div className="mb-4">
                  <button
                    onClick={() => setBeatToPromote(beat)}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold px-4 py-3 rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    title="Продвигать бит"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span>Продвинуть бит • 200 ₽</span>
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onPlay?.(beat)}
                    className={`${
                      currentPlayingBeat?.id === beat.id && isPlaying
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-red-600 hover:bg-red-700'
                    } text-white p-3 rounded-full transition-colors cursor-pointer`}
                    title={currentPlayingBeat?.id === beat.id && isPlaying ? "Пауза" : "Воспроизвести"}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      {currentPlayingBeat?.id === beat.id && isPlaying ? (
                        <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                      ) : (
                        <path d="M8 5v14l11-7z"/>
                      )}
                    </svg>
                  </button>

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
                      className="bg-red-500 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-full transition-colors cursor-pointer"
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
                    className={`p-3 rounded-full transition-colors cursor-pointer ${
                      favoriteBeats.some(fav => fav.id === beat.id) ? 'text-red-500' : 'text-white hover:bg-neutral-700'
                    }`}
                    title={favoriteBeats.some(fav => fav.id === beat.id) ? 'Убрать из избранного' : 'Добавить в избранное'}
                  >
                    <svg className="w-4 h-4" fill={favoriteBeats.some(fav => fav.id === beat.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>

                <div className="text-xs text-neutral-500">
                  {new Date(beat.created_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
            </animated.div>
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
        onPromote={(beatId) => console.log('Promoting beat:', beatId)}
      />
    </>
  );
};

export default BeatList;