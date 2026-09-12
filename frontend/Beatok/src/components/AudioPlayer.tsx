import React, { useState, useRef, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useModal } from '../hooks/useModal';
import { apiUrl } from '../services/api';

const getCoverUrl = (beat: any): string | null => {
  if (!beat?.cover_path) return null;
  return apiUrl(`/static/covers/${beat.cover_path}`);
};

const getAudioFormat = (beat: any): string => {
  if (!beat?.audio_file_path) return '';
  return beat.audio_file_path.split('.').pop()?.toUpperCase() || '';
};

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
  const [isHoveringCover, setIsHoveringCover] = useState(false);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isFavorite = favoriteBeats.some((fav) => fav.id === currentBeat?.id);
  const coverUrl = getCoverUrl(currentBeat);
  const audioFormat = getAudioFormat(currentBeat);

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

  const openFavoriteAction = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }
    if (currentBeat) toggleFavorite(currentBeat);
  };

  if (!currentBeat && isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/16 bg-[rgba(10,13,20,0.16)] pb-safe backdrop-blur-sm">
        <div className="px-4 py-3 text-center text-sm text-[var(--text-secondary)]">
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
          className="fixed bottom-18 left-1/2 z-50 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-white/16 bg-[rgba(16,20,30,0.18)] text-white shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-red-500/40 hover:text-red-200"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 14l5-5 5 5z" />
          </svg>
        </button>
      )}

      {isMinimized && !isMobile && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-3 left-1/2 z-50 flex h-11 -translate-x-1/2 items-center justify-center rounded-full border border-white/16 bg-[rgba(16,20,30,0.18)] px-4 text-white shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-red-500/40 hover:text-red-200"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 14l5-5 5 5z" />
          </svg>
        </button>
      )}

      <animated.div
        className={`fixed bottom-0 left-0 right-0 z-40 ${isAnyModalOpen ? 'blur-[2px]' : ''} ${isMobile ? 'pb-safe' : 'px-3 pb-3'}`}
        style={styles}
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="relative overflow-hidden rounded-t-[30px] border border-white/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.02)_18%,transparent_52%),linear-gradient(180deg,rgba(16,21,32,0.18),rgba(9,12,18,0.22))] shadow-[0_-16px_48px_rgba(0,0,0,0.22)] backdrop-blur-sm">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),transparent_20%),radial-gradient(circle_at_top_left,rgba(220,38,38,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_20%)]" />

            {isMobile ? (
              <div className="relative px-3 pb-4 pt-3">
                <div className="mb-3 flex justify-center">
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="flex h-7 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--text-secondary)] transition duration-300 hover:bg-white/10 hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 10l5 5 5-5z" />
                    </svg>
                  </button>
                </div>

                <div className="mb-4 flex items-center gap-3">
                  <button
                    onClick={togglePlayPause}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_16px_30px_rgba(0,0,0,0.28)]"
                    onMouseEnter={() => setIsHoveringCover(true)}
                    onMouseLeave={() => setIsHoveringCover(false)}
                  >
                    {coverUrl ? (
                      <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(220,38,38,0.86),rgba(127,29,29,0.92))]">
                        <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                    <div className={`absolute inset-0 flex items-center justify-center bg-black/45 transition duration-200 ${(isHoveringCover || isPlaying) ? 'opacity-100' : 'opacity-0'}`}>
                      {isPlaying ? (
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </div>
                    {isPlaying && !isHoveringCover && (
                      <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_12px_rgba(220,38,38,0.9)]" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white">{currentBeat.name}</p>
                      {audioFormat && (
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.22em] ${audioFormat === 'WAV' ? 'border-sky-400/25 bg-sky-400/12 text-sky-200' : 'border-emerald-400/25 bg-emerald-400/12 text-emerald-200'}`}>
                          {audioFormat}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-[var(--text-secondary)]">
                      {currentBeat.owner?.username || `${currentBeat.author?.username}`}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                      <span>Сейчас играет</span>
                      <span className="h-1 w-1 rounded-full bg-red-500" />
                      <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                  </div>

                  <button
                    onClick={openFavoriteAction}
                    className={`flex h-11 w-11 items-center justify-center rounded-full border transition duration-300 ${isFavorite ? 'border-red-500/35 bg-red-500/12 text-red-400 shadow-[0_0_24px_rgba(220,38,38,0.22)]' : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20 hover:bg-white/10 hover:text-white'}`}
                  >
                    <svg className="h-5 w-5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>

                <div className="mb-4 flex items-center justify-center gap-3">
                  <button
                    onClick={previousBeat}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--text-secondary)] transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                    </svg>
                  </button>

                  <button
                    onClick={togglePlayPause}
                    className="flex h-16 w-16 items-center justify-center rounded-full border border-red-500/40 bg-[linear-gradient(135deg,rgba(220,38,38,0.95),rgba(127,29,29,0.94))] text-white shadow-[0_18px_40px_rgba(220,38,38,0.35)] transition duration-300 hover:scale-[1.03] hover:shadow-[0_22px_48px_rgba(220,38,38,0.45)] active:scale-95"
                  >
                    {isPlaying ? (
                      <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                      </svg>
                    ) : (
                      <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={nextBeat}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--text-secondary)] transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                    </svg>
                  </button>
                </div>

                <div className="mb-3">
                  <div
                    ref={progressBarRef}
                    className="relative h-3 w-full cursor-pointer overflow-hidden rounded-full border border-white/10 bg-white/8"
                    onMouseDown={handleMouseDown}
                  >
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,rgba(220,38,38,0.95),rgba(255,255,255,0.7))] shadow-[0_0_24px_rgba(220,38,38,0.22)]"
                      style={{ width: `${progress}%` }}
                    />
                    <div
                      className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-white/30 bg-white shadow-[0_0_18px_rgba(255,255,255,0.35)]"
                      style={{ left: `calc(${progress}% - 8px)` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-[var(--text-secondary)]">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={toggleMute}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--text-secondary)] transition duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    {volume === 0 ? (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3z" />
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                        <path d="M19 12c0 2.89-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                      </svg>
                    )}
                  </button>

                  <div
                    ref={volumeBarRef}
                    className="relative h-2.5 w-28 cursor-pointer rounded-full border border-white/10 bg-white/8"
                    onMouseDown={handleVolumeMouseDown}
                  >
                    <div
                      className="h-full rounded-full bg-white/70"
                      style={{ width: `${volume * 100}%` }}
                    />
                    <div
                      className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.32)]"
                      style={{ left: `calc(${volume * 100}% - 7px)` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative px-5 pb-5 pt-4">
                <div className="mb-4 flex justify-center">
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="flex h-8 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--text-secondary)] transition duration-300 hover:bg-white/10 hover:text-white"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 10l5 5 5-5z" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_minmax(360px,420px)_minmax(0,1fr)] items-center gap-6">
                  <div className="flex min-w-0 items-center gap-4">
                    <button
                      onClick={togglePlayPause}
                      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[22px] border border-white/10 bg-white/5 shadow-[0_20px_34px_rgba(0,0,0,0.28)]"
                      onMouseEnter={() => setIsHoveringCover(true)}
                      onMouseLeave={() => setIsHoveringCover(false)}
                    >
                      {coverUrl ? (
                        <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(220,38,38,0.86),rgba(127,29,29,0.92))]">
                          <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      )}
                      <div className={`absolute inset-0 flex items-center justify-center bg-black/45 transition duration-200 ${(isHoveringCover || isPlaying) ? 'opacity-100' : 'opacity-0'}`}>
                        {isPlaying ? (
                          <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                          </svg>
                        ) : (
                          <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </div>
                    </button>

                    <div className="min-w-0">
                      <div className="mb-2 flex items-center gap-2">
                        <h4 className="truncate text-lg font-semibold text-white">{currentBeat.name}</h4>
                        {audioFormat && (
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.22em] ${audioFormat === 'WAV' ? 'border-sky-400/25 bg-sky-400/12 text-sky-200' : 'border-emerald-400/25 bg-emerald-400/12 text-emerald-200'}`}>
                            {audioFormat}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm text-[var(--text-secondary)]">
                        {currentBeat.owner?.username || `${currentBeat.author?.username}`}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                        <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="justify-self-center flex w-full max-w-[420px] flex-col items-center gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={previousBeat}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--text-secondary)] transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:text-white"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                        </svg>
                      </button>

                      <button
                        onClick={togglePlayPause}
                        className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/40 bg-[linear-gradient(135deg,rgba(220,38,38,0.95),rgba(127,29,29,0.94))] text-white shadow-[0_18px_40px_rgba(220,38,38,0.35)] transition duration-300 hover:scale-[1.03] hover:shadow-[0_22px_48px_rgba(220,38,38,0.45)] active:scale-95"
                      >
                        {isPlaying ? (
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                          </svg>
                        ) : (
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>

                      <button
                        onClick={nextBeat}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--text-secondary)] transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:text-white"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex w-full items-center gap-3">
                      <span className="w-11 text-right text-xs text-[var(--text-secondary)]">{formatTime(currentTime)}</span>
                      <div
                        ref={progressBarRef}
                        className="relative h-3 flex-1 cursor-pointer overflow-hidden rounded-full border border-white/10 bg-white/8"
                        onMouseDown={handleMouseDown}
                      >
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,rgba(220,38,38,0.95),rgba(255,255,255,0.7))] shadow-[0_0_24px_rgba(220,38,38,0.22)]"
                          style={{ width: `${progress}%` }}
                        />
                        <div
                          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-white/30 bg-white shadow-[0_0_18px_rgba(255,255,255,0.35)]"
                          style={{ left: `calc(${progress}% - 8px)` }}
                        />
                      </div>
                      <span className="w-11 text-xs text-[var(--text-secondary)]">{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={toggleMute}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--text-secondary)] transition duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                    >
                      {volume === 0 ? (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 9v6h4l5 5V4L7 9H3z" />
                          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                          <path d="M19 12c0 2.89-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                        </svg>
                      )}
                    </button>

                    <div
                      ref={volumeBarRef}
                      className="relative h-2.5 w-28 cursor-pointer rounded-full border border-white/10 bg-white/8"
                      onMouseDown={handleVolumeMouseDown}
                    >
                      <div
                        className="h-full rounded-full bg-white/70"
                        style={{ width: `${volume * 100}%` }}
                      />
                      <div
                        className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.32)]"
                        style={{ left: `calc(${volume * 100}% - 7px)` }}
                      />
                    </div>

                    <button
                      onClick={openFavoriteAction}
                      className={`ml-2 flex h-11 w-11 items-center justify-center rounded-full border transition duration-300 ${isFavorite ? 'border-red-500/35 bg-red-500/12 text-red-400 shadow-[0_0_24px_rgba(220,38,38,0.22)]' : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20 hover:bg-white/10 hover:text-white'}`}
                    >
                      <svg className="h-5 w-5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </animated.div>
    </>
  );
};

export default AudioPlayer;
