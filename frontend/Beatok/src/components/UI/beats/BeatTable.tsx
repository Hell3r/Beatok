import React, { useState, useMemo } from 'react';
import type { Beat } from '../../../types/Beat';
import { truncateText } from '../../../utils/truncateText';
import { formatDuration } from '../../../utils/formatDuration';
import type { Filters } from './Filter';

interface BeatTableProps {
  beats: Beat[];
  loading?: boolean;
  currentPlayingBeat?: Beat | null;
  isPlaying?: boolean;
  onPlay?: (beat: Beat) => void;
  onDownload?: (beat: Beat) => void;
  filters: Filters;
  isProfileView?: boolean;
  onShowRejectionReason?: (beat: Beat) => void;
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
  onShowRejectionReason,
}) => {
  const [sortField, setSortField] = useState<keyof Beat>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedBeatId, setExpandedBeatId] = useState<number | null>(null);

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
      if (filters.name && !beat.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
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

  if (loading) {
    return (
      <div className="bg-neutral-900 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-900">
              <th className="p-4 text-center">Название</th>
              <th className="p-4 text-center">Автор</th>
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
                <td className="p-4"><div className="h-4 bg-neutral-700 rounded mx-auto w-3/4"></div></td>
                <td className="p-4"><div className="h-4 bg-neutral-700 rounded mx-auto w-2/3"></div></td>
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
    <div className="bg-neutral-900 rounded-lg overflow-hidden border border-neutral-700">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-900">
              <th
                className="p-4 text-center text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>Название бита</span>
                  <SortIcon field="name" />
                </div>
              </th>
              {!isProfileView && (
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
                className="p-4 text-center text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors"
                onClick={() => handleSort('genre')}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>Жанр</span>
                  <SortIcon field="genre" />
                </div>
              </th>
              <th
                className="p-4 text-center text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors"
                onClick={() => handleSort('tempo')}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>Темп</span>
                  <SortIcon field="tempo" />
                </div>
              </th>
              <th
                className="p-4 text-center text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors"
                onClick={() => handleSort('key')}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>Тон</span>
                  <SortIcon field="key" />
                </div>
              </th>
              <th
                className="p-4 text-center text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors"
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
              {isProfileView ? (
                <th className="p-4 text-center text-white font-semibold">Статус</th>
              ) : (
                <th className="p-4 text-center text-white font-semibold">Действия</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedBeats.map((beat) => (
              <tr
                key={beat.id}
                className="border-b border-neutral-800 hover:bg-neutral-800 transition-all duration-300 group"
                onDoubleClick={() => setExpandedBeatId(expandedBeatId === beat.id ? null : beat.id)}
              >
                <td className="p-4 text-center">
                  <div
                    className="text-white font-medium group-hover:text-red-400 transition-colors cursor-help mx-auto"
                    title={beat.name}
                  >
                    {truncateText(beat.name, 30)}
                  </div>
                  <div className="flex items-center justify-center space-x-1 mt-1">
                    {beat.promotion_status !== 'standard' && (
                      <span className={`text-xs px-1 rounded ${
                        beat.promotion_status === 'featured'
                          ? 'bg-red-600 text-white'
                          : 'bg-yellow-600 text-black'
                      }`}>
                        {beat.promotion_status}
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
                {!isProfileView && (
                  <td className="p-4 text-neutral-300 text-center">
                    {truncateText(getAuthorName(beat), 15)}
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
                {isProfileView ? (
                  <td className="p-4 text-center">
                    <span
                      className={`px-3 py-2 rounded text-sm font-medium cursor-pointer ${
                        beat.status === 'available'
                          ? 'bg-green-600 text-white'
                          : beat.status === 'moderated'
                          ? 'bg-neutral-950 text-white'
                          : beat.status === 'denied'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-red-600 text-white'
                      }`}
                      onClick={() => beat.status === 'denied' && beat.rejection_reason && onShowRejectionReason?.(beat)}
                      title={beat.status === 'denied' && beat.rejection_reason ? 'Нажмите для просмотра причины' : ''}
                    >
                      {beat.status === 'available' ? 'Доступен' : beat.status === 'moderated' ? 'На модерации' : 'Отклонён'}
                    </span>
                  </td>
                ) : (
                  <td className="p-4 text-center">
                    <div className="flex justify-center space-x-2">
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
                      {beat.pricings && beat.pricings.length > 0 ? (
                        <button
                          className="bg-red-500 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-full transition-colors cursor-pointer"
                          style={{ minWidth: '120px' }}
                          title="Купить"
                        >
                          от {Math.min(...beat.pricings.filter(p => p.price !== null && p.is_available).map(p => p.price!))} ₽
                        </button>
                      ) : (
                        <button
                          onClick={() => onDownload?.(beat)}
                          className="bg-neutral-700 hover:bg-neutral-600 text-white px-6 py-2 rounded-full transition-colors cursor-pointer relative"
                          style={{ minWidth: '120px' }}
                          title="Скачать"
                        >
                          Скачать
                          {isFree(beat) && (
                            <div className="absolute -top-1 -right-3 bg-red-600 text-white text-xs font-bold px-1 py-0.5 rounded">
                              Бесплатно
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                )}
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
  );
};

export default BeatTable;