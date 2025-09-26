import React, { useState } from 'react';
import type { Beat } from '../types/Beat';

interface BeatTableProps {
  beats: Beat[];
  loading?: boolean;
  onPlay?: (beat: Beat) => void;
  onDownload?: (beat: Beat) => void;
  onEdit?: (beat: Beat) => void;
  onDelete?: (beat: Beat) => void;
}

const BeatTable: React.FC<BeatTableProps> = ({ 
  beats, 
  loading = false, 
  onPlay, 
  onDownload, 
  onEdit, 
  onDelete 
}) => {
  const [sortField, setSortField] = useState<keyof Beat>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedBeatId, setExpandedBeatId] = useState<number | null>(null);

  // Функция для сокращения текста
  const truncateText = (text: string, maxLength: number = 20): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Форматирование длительности
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Форматирование размера файла
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Форматирование даты
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const sortedBeats = [...beats].sort((a, b) => {
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
      <div className="bg-neutral-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-900">
              <th className="p-4 text-left">Название</th>
              <th className="p-4 text-left">Автор</th>
              <th className="p-4 text-left">Жанр</th>
              <th className="p-4 text-left">Темп</th>
              <th className="p-4 text-left">Тональность</th>
              <th className="p-4 text-left">Длительность</th>
              <th className="p-4 text-left">Размер</th>
              <th className="p-4 text-left">Дата</th>
              <th className="p-4 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-neutral-700 animate-pulse">
                <td className="p-4"><div className="h-4 bg-neutral-700 rounded"></div></td>
                <td className="p-4"><div className="h-4 bg-neutral-700 rounded w-3/4"></div></td>
                <td className="p-4"><div className="h-4 bg-neutral-700 rounded w-1/2"></div></td>
                <td className="p-4"><div className="h-4 bg-neutral-700 rounded w-1/4"></div></td>
                <td className="p-4"><div className="h-4 bg-neutral-700 rounded w-1/4"></div></td>
                <td className="p-4"><div className="h-4 bg-neutral-700 rounded w-1/4"></div></td>
                <td className="p-4"><div className="h-4 bg-neutral-700 rounded w-1/3"></div></td>
                <td className="p-4"><div className="h-4 bg-neutral-700 rounded w-2/3"></div></td>
                <td className="p-4"><div className="h-8 bg-neutral-700 rounded w-full"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-900">
              <th 
                className="p-4 text-left text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-2">
                  <span>Название</span>
                  <SortIcon field="name" />
                </div>
              </th>
              <th 
                className="p-4 text-left text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors"
                onClick={() => handleSort('owner')}
              >
                <div className="flex items-center space-x-2">
                  <span>Автор</span>
                  <SortIcon field="owner" />
                </div>
              </th>
              <th 
                className="p-4 text-left text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors"
                onClick={() => handleSort('genre')}
              >
                <div className="flex items-center space-x-2">
                  <span>Жанр</span>
                  <SortIcon field="genre" />
                </div>
              </th>
              <th 
                className="p-4 text-left text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors"
                onClick={() => handleSort('tempo')}
              >
                <div className="flex items-center space-x-2">
                  <span>Темп</span>
                  <SortIcon field="tempo" />
                </div>
              </th>
              <th 
                className="p-4 text-left text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors"
                onClick={() => handleSort('key')}
              >
                <div className="flex items-center space-x-2">
                  <span>Тональность</span>
                  <SortIcon field="key" />
                </div>
              </th>
              <th 
                className="p-4 text-left text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors"
                onClick={() => handleSort('duration')}
              >
                <div className="flex items-center space-x-2">
                  <span>Длительность</span>
                  <SortIcon field="duration" />
                </div>
              </th>
              <th 
                className="p-4 text-left text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors"
                onClick={() => handleSort('size')}
              >
                <div className="flex items-center space-x-2">
                  <span>Размер</span>
                  <SortIcon field="size" />
                </div>
              </th>
              <th 
                className="p-4 text-left text-white font-semibold cursor-pointer hover:bg-neutral-800 transition-colors"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center space-x-2">
                  <span>Дата создания</span>
                  <SortIcon field="created_at" />
                </div>
              </th>
              <th className="p-4 text-left text-white font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody>
            {sortedBeats.map((beat) => (
              <tr 
                key={beat.id} 
                className="border-b border-neutral-700 hover:bg-neutral-750 transition-colors group"
                onDoubleClick={() => setExpandedBeatId(expandedBeatId === beat.id ? null : beat.id)}
              >
                <td className="p-4">
                  <div 
                    className="text-white font-medium cursor-help"
                    title={beat.name}
                  >
                    {truncateText(beat.name, 20)}
                  </div>
                  {beat.promotion_status !== 'standard' && (
                    <span className={`text-xs px-1 rounded ${
                      beat.promotion_status === 'featured' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-yellow-600 text-black'
                    }`}>
                      {beat.promotion_status}
                    </span>
                  )}
                </td>
                <td className="p-4 text-neutral-300">
                  {truncateText(beat.owner?.username || 'Неизвестно', 15)}
                </td>
                <td className="p-4">
                  <span className="bg-neutral-700 text-neutral-300 px-2 py-1 rounded text-sm">
                    {beat.genre}
                  </span>
                </td>
                <td className="p-4 text-neutral-300 font-mono">
                  {beat.tempo} BPM
                </td>
                <td className="p-4 text-neutral-300 font-mono">
                  {beat.key}
                </td>
                <td className="p-4 text-neutral-300">
                  {formatDuration(beat.duration)}
                </td>
                <td className="p-4 text-neutral-300 text-sm">
                  {formatFileSize(beat.size)}
                </td>
                <td className="p-4 text-neutral-400 text-sm">
                  {formatDate(beat.created_at)}
                </td>
                <td className="p-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onPlay?.(beat)}
                      className="p-2 text-green-400 hover:bg-green-400 hover:text-white rounded transition-colors"
                      title="Воспроизвести"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => onDownload?.(beat)}
                      className="p-2 text-blue-400 hover:bg-blue-400 hover:text-white rounded transition-colors"
                      title="Скачать"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    {onEdit && (
                      <button
                        onClick={() => onEdit?.(beat)}
                        className="p-2 text-yellow-400 hover:bg-yellow-400 hover:text-white rounded transition-colors"
                        title="Редактировать"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete?.(beat)}
                        className="p-2 text-red-400 hover:bg-red-400 hover:text-white rounded transition-colors"
                        title="Удалить"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {beats.length === 0 && !loading && (
        <div className="text-center py-12 text-neutral-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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