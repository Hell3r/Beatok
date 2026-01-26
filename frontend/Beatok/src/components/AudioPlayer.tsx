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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const styles = useSpring({
    transform: currentBeat ? (isMinimized ? 'translateY(100%)' : 'translateY(0%)') : 'translateY(100%)',
    opacity: currentBeat ? 1 : 0,
    config: { tension: 300, friction: 30 },
  });

  // On mobile, show a placeholder when no beat is playing
  if (!currentBeat && isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-700 z-40 pb-safe">
        <div className="px-4 py-3 text-center text-neutral-400 text-sm">
          Выберите бит для воспроизведения
        </div>
      </div>
    );
  }

  if (!currentBeat) return null;

  return (
    <>
      {isMinimized && isMobile && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-16 left-1/2 transform -translate-x-1/2 cursor-pointer bg-neutral-900 border border-neutral-700 p-2 z-50 rounded-lg"
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 14l5-5 5 5z"/>
          </svg>
        </button>
      )}
      {isMinimized && !isMobile && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-0 left-1/2 cursor-pointer transform -translate-x-1/2 bg-neutral-900 border-t border-neutral-700 p-2 z-50 rounded-t-lg"
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 14l5-5 5 5z"/>
          </svg>
        </button>
      )}
      <animated.div
        className={`fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-700 z-40 ${isAnyModalOpen ? 'filter blur-sm' : ''} ${isMobile ? 'pb-safe' : 'pl-2 pr-2 pb-4 pt-2'}`}
        style={styles}
      >
        {isMobile ? (
          // Compact Mobile Layout
          <div className="px-2 py-3 bg-gradient-to-t from-neutral-900 via-neutral-900 to-neutral-800">
            {/* Minimize button */}
            <div className="flex justify-center mb-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="text-neutral-400 hover:text-white transition-all duration-200 cursor-pointer p-1 rounded-full hover:bg-neutral-800"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </button>
            </div>

            {/* Track info with compact styling */}
            <div className="flex items-center space-x-2 mb-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                {isPlaying && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-sm truncate leading-tight">
                  {currentBeat.name}
                </h4>
                <div className="flex items-center space-x-1 mt-0.5">
                  <p className="text-neutral-300 text-xs truncate">
                    {currentBeat.owner?.username || `${currentBeat.author?.username}`}
                  </p>
                  {currentBeat.wav_path && (
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded border border-blue-500/30">WAV</span>
                  )}
                  {!currentBeat.wav_path && currentBeat.mp3_path && (
                    <span className="text-xs bg-green-500/20 text-green-300 px-1 py-0.5 rounded border border-green-500/30">MP3</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  const token = localStorage.getItem('access_token');
                  if (!token) {
                    const event = new CustomEvent('openAuthModal');
                    window.dispatchEvent(event);
                    return;
                  }
                  if (currentBeat) toggleFavorite(currentBeat);
                }}
                className={`p-2 rounded-full transition-all duration-200 cursor-pointer ${
                  favoriteBeats.some(fav => fav.id === currentBeat?.id)
                    ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
                }`}
                title={favoriteBeats.some(fav => fav.id === currentBeat?.id) ? 'Убрать из избранного' : 'Добавить в избранное'}
              >
                <svg className="w-5 h-5" fill={favoriteBeats.some(fav => fav.id === currentBeat?.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {/* Playback controls centered above progress bar */}
            <div className="flex justify-center items-center space-x-4 mb-3">
              <button
                onClick={previousBeat}
                className="text-neutral-400 hover:text-white transition-all duration-200 cursor-pointer p-2 rounded-full hover:bg-neutral-700 hover:scale-105"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>

              <button
                onClick={togglePlayPause}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-4 rounded-full transition-all duration-300 cursor-pointer shadow-lg hover:shadow-red-500/25 transform hover:scale-105 active:scale-95"
              >
                {isPlaying ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              <button
                onClick={nextBeat}
                className="text-neutral-400 hover:text-white transition-all duration-200 cursor-pointer p-2 rounded-full hover:bg-neutral-700 hover:scale-105"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>
            </div>

            {/* Compact Progress bar */}
            <div className="mb-3">
              <div
                ref={progressBarRef}
                className="w-full bg-neutral-700/50 rounded-full h-3 cursor-pointer relative overflow-hidden backdrop-blur-sm"
                onMouseDown={handleMouseDown}
              >
                <div
                  className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-200 shadow-lg"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-red-600 rounded-full shadow-xl transition-all duration-200"
                  style={{ left: `calc(${progress}% - 8px)` }}
                />
              </div>
              <div className="flex justify-between text-xs text-neutral-300 mt-1 mb-6 font-medium">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume controls at bottom */}
            <div className="flex justify-center">
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-neutral-400 hover:text-white transition-all duration-200 cursor-pointer p-2 rounded-full hover:bg-neutral-700"
                >
                  {volume === 0 ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3z"/>
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                      <path d="M19 12c0 2.89-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71z"/>
                      <line x1="24" y1="0" x2="0" y2="30" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  )}
                </button>
                <div
                  ref={volumeBarRef}
                  className="w-16 bg-neutral-700/50 rounded-full h-2 cursor-pointer relative backdrop-blur-sm"
                  onMouseDown={handleVolumeMouseDown}
                >
                  <div
                    className="bg-neutral-300 h-2 rounded-full transition-all duration-200"
                    style={{ width: `${volume * 100}%` }}
                  />
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md transition-all duration-200"
                    style={{ left: `calc(${volume * 100}% - 6px)` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Desktop Layout (unchanged)
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
                  onClick={() => {
                    const token = localStorage.getItem('access_token');
                    if (!token) {
                      const event = new CustomEvent('openAuthModal');
                      window.dispatchEvent(event);
                      return;
                    }
                    if (currentBeat) toggleFavorite(currentBeat);
                  }}
                  className={`p-2 ml-2 rounded-full transition-colors cursor-pointer ${
                    favoriteBeats.some(fav => fav.id === currentBeat?.id) ? 'text-red-500' : 'text-white hover:bg-neutral-700'
                  }`}
                  title={favoriteBeats.some(fav => fav.id === currentBeat?.id) ? 'Убрать из избранного' : 'Добавить в избранное'}
                >
                  <svg className="w-6 h-5" fill={favoriteBeats.some(fav => fav.id === currentBeat?.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
    </animated.div>
    </>
  );
};

export default AudioPlayer;