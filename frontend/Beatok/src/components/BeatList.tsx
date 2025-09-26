import React from 'react';
import type { Beat } from '../types/Beat';

interface BeatListProps {
  beats: Beat[];
  loading?: boolean;
  onPlay?: (beat: Beat) => void;
  onDownload?: (beat: Beat) => void;
}

const BeatList: React.FC<BeatListProps> = ({ beats, loading = false, onPlay, onDownload }) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
              <h3 className="text-white font-semibold text-lg truncate group-hover:text-red-400 transition-colors">
                {beat.name}
              </h3>
              <p className="text-neutral-400 text-sm">
                by {beat.owner?.username || 'Unknown Artist'}
              </p>
            </div>
            
            {beat.promotion_status !== 'standard' && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                beat.promotion_status === 'featured' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-yellow-600 text-black'
              }`}>
                {beat.promotion_status}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
            <div className="text-neutral-300">
              <span className="text-neutral-500">Жанр:</span> {beat.genre}
            </div>
            <div className="text-neutral-300">
              <span className="text-neutral-500">Темп:</span> {beat.tempo} BPM
            </div>
            <div className="text-neutral-300">
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
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors"
                title="Play"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
              
              <button
                onClick={() => onDownload?.(beat)}
                className="bg-neutral-700 hover:bg-neutral-600 text-white p-2 rounded-full transition-colors"
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