import React from 'react';
import type { Beat } from '../../../types/Beat';
import { truncateText } from '../../../utils/truncateText';
import { formatDuration } from '../../../utils/formatDuration';

interface BeatListProps {
  beats: Beat[];
  loading?: boolean;
  currentPlayingBeat?: Beat | null;
  isPlaying?: boolean;
  onPlay?: (beat: Beat) => void;
  onDownload?: (beat: Beat) => void;
}

const BeatList: React.FC<BeatListProps> = ({ 
  beats, 
  loading = false, 
  currentPlayingBeat = null,
  isPlaying = false,
  onPlay, 
  onDownload 
}) => {


  const getAuthorName = (beat: Beat): string => {
    if (beat.owner?.username) return beat.owner.username;
    if (beat.author?.username) return beat.author.username;
    if (beat.user?.username) return beat.user.username;

    if (beat.author_id) return `Пользователь ${beat.author_id}`;
    
    return 'Неизвестно';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {beats.map(beat => (
        <div key={beat.id} className="bg-neutral-800 rounded-lg p-4 hover:bg-neutral-700 transition-all duration-300 group border border-neutral-700">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 
                className="text-white font-semibold text-lg group-hover:text-red-400 transition-colors"
                title={beat.name}
              >
                {truncateText(beat.name, 30)}
              </h3>
              <p className="text-neutral-400 text-sm truncate">
                by {getAuthorName(beat)}
              </p>
            </div>
            
            <div className="flex flex-col items-end space-y-1">
              {beat.promotion_status !== 'standard' && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  beat.promotion_status === 'featured' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-yellow-600 text-black'
                }`}>
                  {beat.promotion_status}
                </span>
              )}
              {/* Индикатор качества звука */}
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
              <span className="text-neutral-500">Длительность:</span> {formatDuration(beat.duration)}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={() => onPlay?.(beat)}
                className={`${
                  currentPlayingBeat?.id === beat.id && isPlaying
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } text-white p-2 rounded-full transition-colors cursor-pointer`}
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
              
              <button
                onClick={() => onDownload?.(beat)}
                className="bg-neutral-700 hover:bg-neutral-600 text-white p-2 rounded-full transition-colors cursor-pointer"
                title="Download"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>

            <div className="text-xs text-neutral-500">
              {new Date(beat.created_at).toLocaleDateString('ru-RU')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BeatList;