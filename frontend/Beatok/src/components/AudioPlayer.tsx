import React, { useState, useRef, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useModal } from '../hooks/useModal';

const AudioPlayer: React.FC = () => {
  const {
    currentBeat,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlayPause,
    seekTo,
    setVolume,
    toggleMute,
    nextBeat,
    previousBeat,
    toggleFavorite,
    favoriteBeats,
    isMinimized,
    setIsMinimized,
  } = useAudioPlayer();
  const { isAnyModalOpen } = useModal();
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seekTo(percent * duration);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(percent * duration);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleVolumeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingVolume(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    setVolume(percent);
  };

  const handleVolumeMouseMove = (e: MouseEvent) => {
    if (!isDraggingVolume || !volumeBarRef.current) return;
    const rect = volumeBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(percent);
  };

  const handleVolumeMouseUp = () => {
    setIsDraggingVolume(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (isDraggingVolume) {
      document.addEventListener('mousemove', handleVolumeMouseMove);
      document.addEventListener('mouseup', handleVolumeMouseUp);
    } else {
      document.removeEventListener('mousemove', handleVolumeMouseMove);
      document.removeEventListener('mouseup', handleVolumeMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleVolumeMouseMove);
      document.removeEventListener('mouseup', handleVolumeMouseUp);
    };
  }, [isDraggingVolume]);

  const styles = useSpring({
    transform: currentBeat ? (isMinimized ? 'translateY(100%)' : 'translateY(0%)') : 'translateY(100%)',
    opacity: currentBeat ? 1 : 0,
    config: { tension: 300, friction: 30 },
  });

  if (!currentBeat) return null;

  return (
    <>
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-0 left-1/2 cursor-pointer transform -translate-x-1/2 bg-neutral-900 border-t border-neutral-700 p-2 z-40 rounded-t-lg"
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 14l5-5 5 5z"/>
          </svg>
        </button>
      )}
      <animated.div
        className={`fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-700 pl-2 pr-2 pb-4 pt-2 z-40 ${isAnyModalOpen ? 'filter blur-sm' : ''}`}
        style={styles}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center mb-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </button>
          </div>
          <div className="flex items-center justify-between">
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
                    {currentBeat.owner?.username || `${currentBeat.author?.username}`}
                  </p>
                  {currentBeat.wav_path && (
                    <span className="text-xs bg-blue-600 text-white px-1 rounded">WAV</span>
                  )}
                  {!currentBeat.wav_path && currentBeat.mp3_path && (
                    <span className="text-xs bg-green-600 text-white px-1 rounded">MP3</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
              <div className="flex items-center space-x-4">
                <button
                  onClick={previousBeat}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5 cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                  </svg>
                </button>

                <button
                  onClick={togglePlayPause}
                  className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors cursor-pointer"
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
                  onClick={nextBeat}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5 cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                  </svg>
                </button>
              </div>

              <div className="flex items-center space-x-3 w-full">
                <span className="text-xs text-neutral-400 w-10">
                  {formatTime(currentTime)}
                </span>
                <div
                  ref={progressBarRef}
                  className="flex-1 bg-neutral-700 rounded-full h-2 cursor-pointer relative"
                  onMouseDown={handleMouseDown}
                >
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-4 border-red-700 rounded-full"
                    style={{ left: `calc(${progress}% - 8px)` }}
                  />
                </div>
                <span className="text-xs text-neutral-400 w-10">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 flex-1 justify-end">
              <button
                onClick={toggleMute}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                {volume === 0 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3z"/>
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                    <path d="M19 12c0 2.89-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71z"/>
                    <line x1="24" y1="0" x2="0" y2="30" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                )}
              </button>
              <div
                ref={volumeBarRef}
                className="w-24 bg-neutral-700 rounded-full h-2 cursor-pointer relative"
                onMouseDown={handleVolumeMouseDown}
              >
                <div
                  className="bg-neutral-400 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${volume * 100}%` }}
                />
                <div
                  className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center"
                  style={{ left: `calc(${volume * 100}% - 8px)` }}
                >
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <button
                onClick={() => currentBeat && toggleFavorite(currentBeat)}
                className={`p-2 ml-2 rounded-full transition-all duration-200 cursor-pointer ${
                  favoriteBeats.some(fav => fav.id === currentBeat?.id)
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'text-neutral-400 hover:bg-neutral-600 hover:text-white'
                }`}
                title={favoriteBeats.some(fav => fav.id === currentBeat?.id) ? 'Убрать из избранного' : 'Добавить в избранное'}
              >
                <svg
                  className="w-6 h-6"
                  fill={favoriteBeats.some(fav => fav.id === currentBeat?.id) ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
    </animated.div>
    </>
  );
};

export default AudioPlayer;