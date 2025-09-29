import React from 'react';
import type { Beat } from '../types/Beat';

interface AudioPlayerProps {
  currentBeat: Beat | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  currentBeat,
  isPlaying,
  currentTime,
  duration,
  volume,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onNext,
  onPrevious,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentBeat) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-700 p-4 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Track Info */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="flex-shrink-0 w-12 h-12 bg-neutral-800 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-semibold truncate">
                {currentBeat.name}
              </h4>
              <div className="flex items-center space-x-2">
                <p className="text-neutral-400 text-sm truncate">
                  {currentBeat.owner?.username || `User ${currentBeat.author_id}`}
                </p>
                {/* Индикатор формата в плеере */}
                {currentBeat.wav_path && (
                  <span className="text-xs bg-blue-600 text-white px-1 rounded">WAV</span>
                )}
                {!currentBeat.wav_path && currentBeat.mp3_path && (
                  <span className="text-xs bg-green-600 text-white px-1 rounded">MP3</span>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
            <div className="flex items-center space-x-4">
              <button
                onClick={onPrevious}
                className="text-neutral-400 hover:text-white transition-colors"
                disabled={!onPrevious}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>

              <button
                onClick={onPlayPause}
                className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              <button
                onClick={onNext}
                className="text-neutral-400 hover:text-white transition-colors"
                disabled={!onNext}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center space-x-3 w-full">
              <span className="text-xs text-neutral-400 w-10">
                {formatTime(currentTime)}
              </span>
              <div 
                className="flex-1 bg-neutral-700 rounded-full h-1 cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  onSeek(percent * duration);
                }}
              >
                <div 
                  className="bg-red-600 h-1 rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-neutral-400 w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3 flex-1 justify-end">
            <svg className="w-5 h-5 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <div 
              className="w-24 bg-neutral-700 rounded-full h-1 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                onVolumeChange(percent);
              }}
            >
              <div 
                className="bg-neutral-400 h-1 rounded-full"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;