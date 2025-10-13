import React from 'react';
import type { Beat } from '../../../types/Beat';

interface BeatCardProps {
  beat: Beat;
  onPlay?: (beat: Beat) => void;
  onDownload?: (beat: Beat) => void;
}

const BeatCard: React.FC<BeatCardProps> = ({ beat, onPlay, onDownload }) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-neutral-800 rounded-lg p-4 hover:bg-neutral-700 transition-all duration-300 group border border-neutral-700">
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

      <div className="w-full bg-neutral-700 rounded-full h-1 mb-3">
        <div 
          className="bg-red-600 h-1 rounded-full transition-all duration-500"
          style={{ width: '0%' }}
        ></div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => onPlay?.(beat)}
            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors group/btn"
            title="Play"
          >
            <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          
          <button
            onClick={() => onDownload?.(beat)}
            className="bg-neutral-700 hover:bg-neutral-600 text-white p-2 rounded-full transition-colors group/btn"
            title="Download"
          >
            <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>

        <div className="text-xs text-neutral-500">
          {formatFileSize(beat.size)}
        </div>
      </div>
    </div>
  );
};

export default BeatCard;