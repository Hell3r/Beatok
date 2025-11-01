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

  const loadBeat = async (beat: Beat) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No access token');
      return;
    }

    const baseUrl = 'http://localhost:8000';
    const beatFolder = `beats/${beat.id}`;
    const wavUrl = `${baseUrl}/audio_storage/${beatFolder}/audio.wav`;
    const mp3Url = `${baseUrl}/audio_storage/${beatFolder}/audio.mp3`;

    let response;

    try {
      response = await fetch(wavUrl, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) {
        response = await fetch(mp3Url, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) {
          console.error('No audio files available for beat:', beat.id);
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching audio:', error);
      return;
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    if (!audioRef.current) {
      console.error('Audio ref is not initialized');
      return;
    }

    if (audioRef.current.src) {
      URL.revokeObjectURL(audioRef.current.src);
    }
    audioRef.current.src = blobUrl;
    audioRef.current.currentTime = currentTime;
  };

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
        audioRef.current.play().catch(error => {
          console.error('Error resuming playback on visibility change:', error);
        });
      }
    };

    audioRef.current.addEventListener('timeupdate', updateTime);
    audioRef.current.addEventListener('loadedmetadata', updateDuration);
    audioRef.current.addEventListener('ended', handleEnded);
    audioRef.current.addEventListener('error', handleError);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (currentBeat) {
      loadBeat(currentBeat).then(() => {
        if (isPlaying && audioRef.current) {
          audioRef.current.play().catch(error => {
            console.error('Error resuming playback:', error);
            setIsPlaying(false);
          });
        }
      });
    }

    const loadFavoriteBeats = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const data = await beatService.getFavoriteBeats(parseInt(JSON.parse(atob(token.split('.')[1])).sub));
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
    };
  }, []);





  const playBeat = async (beat: Beat) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No access token');
      return;
    }

    const baseUrl = 'http://localhost:8000';
    const beatFolder = `beats/${beat.id}`;
    const wavUrl = `${baseUrl}/audio_storage/${beatFolder}/audio.wav`;
    const mp3Url = `${baseUrl}/audio_storage/${beatFolder}/audio.mp3`;

    let response;

    try {
      response = await fetch(wavUrl, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) {
        response = await fetch(mp3Url, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) {
          console.error('No audio files available for beat:', beat.id);
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching audio:', error);
      return;
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    if (!audioRef.current) {
      console.error('Audio ref is not initialized');
      return;
    }

    try {
      if (currentBeat?.id !== beat.id) {
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current.src = blobUrl;
        setCurrentBeat(beat);
        localStorage.setItem('currentBeat', JSON.stringify(beat));
        setCurrentTime(0);
        setIsPlaying(true);
        localStorage.setItem('isPlaying', 'true');

        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      } else {
        const newPlayingState = !isPlaying;
        setIsPlaying(newPlayingState);

        if (newPlayingState) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        } else {
          audioRef.current.pause();
        }
        localStorage.setItem('isPlaying', newPlayingState.toString());
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

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
        } else {
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

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

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
