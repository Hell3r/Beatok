import React, { createContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Beat } from '../types/Beat';
import { beatService } from '../services/beatService';

interface AudioPlayerContextType {
  currentBeat: Beat | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  beats: Beat[];
  setBeats: (beats: Beat[]) => void;
  playBeat: (beat: Beat) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  nextBeat: () => void;
  previousBeat: () => void;
  toggleFavorite: (beat: Beat) => Promise<void>;
  favoriteBeats: Beat[];
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export { AudioPlayerContext };

interface AudioPlayerProviderProps {
  children: ReactNode;
}


export const AudioPlayerProvider: React.FC<AudioPlayerProviderProps> = ({ children }) => {
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(() => {
    const saved = localStorage.getItem('currentBeat');
    return saved ? JSON.parse(saved) : null;
  });
  const [isPlaying, setIsPlaying] = useState(() => {
    const saved = localStorage.getItem('isPlaying');
    return saved ? JSON.parse(saved) : false;
  });
  const [currentTime, setCurrentTime] = useState(() => {
    const saved = localStorage.getItem('currentTime');
    return saved ? parseFloat(saved) : 0;
  });
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem('volume');
    return saved ? parseFloat(saved) : 0.7;
  });
  const [previousVolume, setPreviousVolume] = useState(() => {
    const saved = localStorage.getItem('previousVolume');
    return saved ? parseFloat(saved) : 0.7;
  });
  const [beats, setBeats] = useState<Beat[]>([]);
  const [favoriteBeats, setFavoriteBeats] = useState<Beat[]>([]);
  const [isMinimized, setIsMinimizedState] = useState(() => {
    const saved = localStorage.getItem('isMinimized');
    return saved ? JSON.parse(saved) : false;
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pausedDueToVisibility = useRef(false);

  // ----- Функция для получения presigned URL с бэкенда -----
  const fetchAudioUrl = async (beatId: number): Promise<{ audio_url: string; audio_format: string } | null> => {
    try {
      const response = await fetch(`http://0.0.0.0:8000/beats/${beatId}/audio-url`);
      if (!response.ok) {
        console.error('Failed to fetch audio URL');
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching audio URL:', error);
      return null;
    }
  };

  // ----- Инициализация аудиоэлемента и обработчиков -----
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const updateTime = () => {
      const time = audioRef.current?.currentTime || 0;
      setCurrentTime(time);
      localStorage.setItem('currentTime', time.toString());
    };
    const updateDuration = () => setDuration(audioRef.current?.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      localStorage.setItem('currentTime', '0');
      nextBeat();
    };
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying && audioRef.current) {
        setTimeout(() => {
          if (document.hidden && isPlaying && audioRef.current) {
            audioRef.current.pause();
            pausedDueToVisibility.current = true;
            setIsPlaying(false);
            localStorage.setItem('isPlaying', 'false');
          }
        }, 100);
      } else if (!document.hidden && pausedDueToVisibility.current && audioRef.current) {
        pausedDueToVisibility.current = false;
        setIsPlaying(true);
        localStorage.setItem('isPlaying', 'true');
        audioRef.current.play().catch(error => {
          console.error('Error resuming playback on visibility change:', error);
        });
      }
    };

    const handleWindowBlur = () => {
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        pausedDueToVisibility.current = true;
        setIsPlaying(false);
        localStorage.setItem('isPlaying', 'false');
      }
    };

    const handleWindowFocus = () => {
      if (pausedDueToVisibility.current && audioRef.current) {
        pausedDueToVisibility.current = false;
        setIsPlaying(true);
        localStorage.setItem('isPlaying', 'true');
        audioRef.current.play().catch(error => {
          console.error('Error resuming playback on window focus:', error);
        });
      }
    };

    audioRef.current.addEventListener('timeupdate', updateTime);
    audioRef.current.addEventListener('loadedmetadata', updateDuration);
    audioRef.current.addEventListener('ended', handleEnded);
    audioRef.current.addEventListener('error', handleError);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    // Восстанавливаем состояние из localStorage
    const initAudio = async () => {
      if (currentBeat && currentBeat.id) {
        const audioData = await fetchAudioUrl(currentBeat.id);
        if (audioData && audioRef.current) {
          audioRef.current.src = audioData.audio_url;
          audioRef.current.currentTime = currentTime;
          if (isPlaying) {
            try {
              await audioRef.current.play();
            } catch (error) {
              console.error('Error resuming playback:', error);
              setIsPlaying(false);
              localStorage.setItem('isPlaying', 'false');
            }
          }
        }
      }
    };
    initAudio();

    // Загрузка избранного
    const loadFavoriteBeats = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const data = await beatService.getFavoriteBeats();
        setFavoriteBeats(data);
      } catch (error) {
        console.error('Error loading favorite beats:', error);
      }
    };
    loadFavoriteBeats();

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', updateTime);
        audioRef.current.removeEventListener('loadedmetadata', updateDuration);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('error', handleError);
        audioRef.current.pause();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []); // пустой массив – инициализация один раз

  // ----- Основная функция воспроизведения -----
  const playBeat = async (beat: Beat) => {
    if (!audioRef.current) {
      console.error('Audio ref is not initialized');
      return;
    }

    // Получаем свежий presigned URL
    const audioData = await fetchAudioUrl(beat.id);
    if (!audioData) {
      console.error('No audio URL for beat:', beat.id);
      return;
    }

    const { audio_url, audio_format } = audioData;

    try {
      if (currentBeat?.id !== beat.id) {
        // Переключаемся на новый бит
        audioRef.current.src = audio_url;
        audioRef.current.currentTime = 0;
        // Обогащаем объект бита (можно сохранить для отображения формата)
        const enrichedBeat = { ...beat, audio_url, audio_format };
        setCurrentBeat(enrichedBeat);
        localStorage.setItem('currentBeat', JSON.stringify(enrichedBeat));
        setCurrentTime(0);
        setIsPlaying(true);
        localStorage.setItem('isPlaying', 'true');

        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      } else {
        // Тот же бит – просто переключаем паузу/воспроизведение
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
          localStorage.setItem('isPlaying', 'false');
        } else {
          // Если URL устарел (например, изменился ключ), обновляем src
          if (audioRef.current.src !== audio_url) {
            audioRef.current.src = audio_url;
          }
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
            setIsPlaying(true);
            localStorage.setItem('isPlaying', 'true');
          }
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      localStorage.setItem('isPlaying', 'false');
    }
  };

  // ----- Переключение паузы/воспроизведения (без смены трека) -----
  const togglePlayPause = async () => {
    if (!audioRef.current || !currentBeat) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        localStorage.setItem('isPlaying', 'false');
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
          localStorage.setItem('isPlaying', 'true');
        }
      }
    } catch (error) {
      console.error('Error in play/pause:', error);
      setIsPlaying(false);
      localStorage.setItem('isPlaying', 'false');
    }
  };

  // ----- Поиск (seek) -----
  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // ----- Громкость -----
  const setVolume = (newVolume: number) => {
    if (newVolume === 0 && volume > 0) {
      setPreviousVolume(volume);
      localStorage.setItem('previousVolume', volume.toString());
    }
    setVolumeState(newVolume);
    localStorage.setItem('volume', newVolume.toString());
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (volume === 0) {
      setVolume(previousVolume);
    } else {
      setVolume(0);
    }
  };

  // ----- Следующий / предыдущий бит (на основе списка beats) -----
  const nextBeat = () => {
    if (!currentBeat || beats.length === 0) return;

    const currentIndex = beats.findIndex(beat => beat.id === currentBeat.id);
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % beats.length;
    const nextBeatToPlay = beats[nextIndex];
    playBeat(nextBeatToPlay);
  };

  const previousBeat = () => {
    if (!currentBeat || beats.length === 0) return;

    const currentIndex = beats.findIndex(beat => beat.id === currentBeat.id);
    if (currentIndex === -1) return;

    const prevIndex = currentIndex === 0 ? beats.length - 1 : currentIndex - 1;
    const prevBeatToPlay = beats[prevIndex];
    playBeat(prevBeatToPlay);
  };

  // ----- Избранное -----
  const toggleFavorite = async (beat: Beat) => {
    try {
      const isFavorite = favoriteBeats.some(fav => fav.id === beat.id);
      if (isFavorite) {
        await beatService.removeFromFavorites(beat.id);
        setFavoriteBeats(prev => prev.filter(fav => fav.id !== beat.id));
      } else {
        await beatService.toggleFavorite(beat.id);
        setFavoriteBeats(prev => [...prev, beat]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // ----- Сворачивание плеера -----
  const setIsMinimized = (minimized: boolean) => {
    setIsMinimizedState(minimized);
    localStorage.setItem('isMinimized', minimized.toString());
  };

  const value: AudioPlayerContextType = {
    currentBeat,
    isPlaying,
    currentTime,
    duration,
    volume,
    beats,
    setBeats,
    playBeat,
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
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
};