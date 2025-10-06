import React, { useState, useEffect, useRef } from 'react';
import BeatTable from '../components/BeatTable';
import BeatList from '../components/BeatList';
import ViewToggle from '../components/ViewToggle';
import AudioPlayer from '../components/AudioPlayer';
import { beatService } from '../services/beatService';
import type { Beat } from '../types/Beat';

type ViewMode = 'table' | 'grid';

const BeatsPage: React.FC = () => {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const updateTime = () => setCurrentTime(audioRef.current?.currentTime || 0);
    const updateDuration = () => setDuration(audioRef.current?.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
    };

    audioRef.current.addEventListener('timeupdate', updateTime);
    audioRef.current.addEventListener('loadedmetadata', updateDuration);
    audioRef.current.addEventListener('ended', handleEnded);
    audioRef.current.addEventListener('error', handleError);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', updateTime);
        audioRef.current.removeEventListener('loadedmetadata', updateDuration);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('error', handleError);
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    loadBeats();
  }, []);

  const loadBeats = async () => {
    try {
      setLoading(true);
      const data = await beatService.getBeats();
      console.log('Loaded beats:', data);
      setBeats(data);
    } catch (error) {
      console.error('Error loading beats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAudioSource = (beat: Beat): string | null => {
    const baseUrl = 'http://localhost:8000';
    const beatFolder = `beats/${beat.id}`;

    const wavUrl = `${baseUrl}/audio_storage/${beatFolder}/audio.wav`;
    const mp3Url = `${baseUrl}/audio_storage/${beatFolder}/audio.mp3`;

    console.log('Trying WAV URL:', wavUrl);
    console.log('Trying MP3 URL:', mp3Url);

    return wavUrl;
  };

  const checkAudioFile = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      console.log('File not available:', url);
      return false;
    }
  };

  const handlePlay = async (beat: Beat) => {
    console.log('Play clicked for beat:', beat);

    const baseUrl = 'http://localhost:8000';
    const beatFolder = `beats/${beat.id}`;

    const wavUrl = `${baseUrl}/audio_storage/${beatFolder}/audio.wav`;
    const mp3Url = `${baseUrl}/audio_storage/${beatFolder}/audio.mp3`;

    const wavAvailable = await checkAudioFile(wavUrl);
    const mp3Available = await checkAudioFile(mp3Url);

    console.log('File availability:', {
      wav: wavAvailable,
      mp3: mp3Available
    });

    let audioSource: string | null = null;

    if (wavAvailable) {
      audioSource = wavUrl;
    } else if (mp3Available) {
      audioSource = mp3Url;
    }

    if (!audioSource) {
      console.error('No audio files available for beat:', beat.id);
      return;
    }

    console.log('Using audio source:', audioSource);

    if (!audioRef.current) {
      console.error('Audio ref is not initialized');
      return;
    }

    try {
      if (currentBeat?.id !== beat.id) {
        console.log('Loading new audio source:', audioSource);
        audioRef.current.src = audioSource;
        setCurrentBeat(beat);
        setCurrentTime(0);

        setIsPlaying(true);

        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log('Audio started playing');
        }
      } else {
        const newPlayingState = !isPlaying;
        setIsPlaying(newPlayingState);

        if (newPlayingState) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log('Audio resumed');
          }
        } else {
          audioRef.current.pause();
          console.log('Audio paused');
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const handleDownload = (beat: Beat) => {
    const downloadSource = getAudioSource(beat);
    const fileExtension = beat.wav_path ? 'wav' : 'mp3';
    
    if (downloadSource) {
      const link = document.createElement('a');
      link.href = downloadSource;
      link.download = `${beat.name}.${fileExtension}`;
      link.click();
    } else {
      alert('Файл для скачивания не доступен');
    }
  };

  const handleEdit = (beat: Beat) => {
    console.log('Edit:', beat);
  };

  const handleDelete = (beat: Beat) => {
    console.log('Delete:', beat);
  };

  const handlePlayPause = async () => {
    if (!audioRef.current || !currentBeat) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Error in play/pause:', error);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 pb-32">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Биты</h1>
            <p className="text-neutral-400">
              Всего битов: <span className="text-white font-semibold">{beats.length}</span>
            </p>
            {currentBeat && (
              <p className="text-xs text-neutral-500 mt-1">
                Текущий: {currentBeat.name} | 
                WAV: {currentBeat.wav_path ? '✓' : '✗'} | 
                MP3: {currentBeat.mp3_path ? '✓' : '✗'}
              </p>
            )}
          </div>
          
          <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-neutral-400 mt-4">Загрузка битов...</p>
          </div>
        ) : viewMode === 'table' ? (
          <BeatTable 
            beats={beats}
            loading={loading}
            currentPlayingBeat={currentBeat}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onDownload={handleDownload}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <BeatList 
            beats={beats}
            loading={loading}
            currentPlayingBeat={currentBeat}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onDownload={handleDownload}
          />
        )}
      </div>

      <AudioPlayer
        currentBeat={currentBeat}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
      />

      <audio ref={audioRef} preload="metadata" />
    </div>
  );
};

export default BeatsPage;