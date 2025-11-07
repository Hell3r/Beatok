import React, { useState, useEffect } from 'react';
import BeatTable from '../components/UI/beats/BeatTable';
import ViewToggle from '../components/UI/beats/ViewToggle';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { beatService } from '../services/beatService';
import type { Beat } from '../types/Beat';
import BeatList from '../components/UI/beats/BeatList';
import Filter, { type Filters } from '../components/UI/beats/Filter';
import { useTransition, animated } from '@react-spring/web';
import { FaFilter } from 'react-icons/fa';

type ViewMode = 'table' | 'grid';

const BeatsPage: React.FC = () => {
  const [beats, setBeatsLocal] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('beatsViewMode');
    return (saved as ViewMode) || 'table';
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleViewModeChange = (newViewMode: ViewMode) => {
    setViewMode(newViewMode);
    localStorage.setItem('beatsViewMode', newViewMode);
  };
  const [filters, setFilters] = useState<Filters>({
    name: '',
    author: '',
    genre: '',
    bpm: '',
    key: '',
    minPrice: '',
    maxPrice: '',
    freeOnly: false
  });
  const [favoriteBeats, setFavoriteBeats] = useState<Beat[]>([]);

  const { playBeat, currentBeat, isPlaying, setBeats } = useAudioPlayer();

  const transitions = useTransition(viewMode, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: { duration: 300 },
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const freeParam = urlParams.get('free');
    if (freeParam === 'true') {
      setFilters(prev => ({ ...prev, freeOnly: true }));
    }
    loadBeats();
    loadFavoriteBeats();
  }, []);

  const loadBeats = async () => {
    try {
      setLoading(true);
      const data = await beatService.getBeats();
      console.log('Loaded beats:', data);
      setBeatsLocal(data);
      setBeats(data);
    } catch (error) {
      console.error('Error loading beats:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleToggleFavorite = async (beat: Beat) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      // Если не авторизован, открываем модальное окно авторизации
      const event = new CustomEvent('openAuthModal');
      window.dispatchEvent(event);
      return;
    }
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



  const handlePlay = async (beat: Beat) => {
    playBeat(beat);
  };

  const handleDownload = async (beat: Beat) => {
    const token = localStorage.getItem("access_token")
    try {
        await fetch(`http://localhost:8000/beats/${beat.id}/increment-download`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.log('Не удалось увеличить счетчик скачиваний, но продолжаем скачивание:', error);
    }
    const baseUrl = 'http://localhost:8000'
    const beatFolder = `beats/${beat.id}`;

    const wavUrl = `${baseUrl}/audio_storage/${beatFolder}/audio.wav`;
    const mp3Url = `${baseUrl}/audio_storage/${beatFolder}/audio.mp3`;

    const checkAudioFile = async (url: string): Promise<boolean> => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
      } catch {
        console.log('File not available:', url);
        return false;
      }
    };

    const wavAvailable = await checkAudioFile(wavUrl);
    const mp3Available = await checkAudioFile(mp3Url);

    let downloadSource: string | null = null;
    let fileExtension: string = '';

    if (wavAvailable) {
      downloadSource = wavUrl;
      fileExtension = 'wav';
    } else if (mp3Available) {
      downloadSource = mp3Url;
      fileExtension = 'mp3';
    }

    if (downloadSource) {
      try {
        const response = await fetch(downloadSource);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${beat.name}.${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download failed:', error);
        alert('Ошибка при скачивании файла');
      }
    } else {
      alert('Файл для скачивания не доступен');
    }
  };



  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <p className="text-neutral-400">
              Всего битов: <span className="text-white font-semibold">{beats.filter(beat => beat.status === 'available').length}</span>
            </p>
            {currentBeat && (
              <p className="text-xs text-neutral-500 mt-1">
                Текущий: {currentBeat.name} |
                WAV: {currentBeat.wav_path ? '✓' : '✗'} |
                MP3: {currentBeat.mp3_path ? '✓' : '✗'}
              </p>
            )}
          </div>

          <ViewToggle currentView={viewMode} onViewChange={handleViewModeChange} />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Filter */}
          <div className="lg:w-80 flex-shrink-0 sticky top-22 self-start">
            <Filter filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Mobile Filter Button and Panel */}
          <div className="md:hidden">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="fixed bottom-20 right-4 z-40 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-colors"
            >
              <FaFilter className="w-5 h-5" />
            </button>

            {/* Mobile Filter Panel */}
            <div
              className={`fixed top-0 left-0 h-full w-full bg-black bg-opacity-50 z-50 transition-transform duration-300 ${
                isFilterOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
              onClick={() => setIsFilterOpen(false)}
            >
              <div
                className="w-80 h-full bg-neutral-900 p-6 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-semibold text-lg">Фильтры</h3>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="text-neutral-400 hover:text-white text-xl"
                  >
                    ×
                  </button>
                </div>
                <Filter filters={filters} onFiltersChange={setFilters} />
              </div>
            </div>
          </div>

          <div className="flex-1">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                <p className="text-neutral-400 mt-4">Загрузка битов...</p>
              </div>
            ) : (
              transitions((style, item) => (
                <animated.div style={style}>
                  {item === 'table' ? (
                    <BeatTable
                      beats={beats}
                      loading={loading}
                      currentPlayingBeat={currentBeat}
                      isPlaying={isPlaying}
                      onPlay={handlePlay}
                      onDownload={handleDownload}
                      filters={filters}
                      onToggleFavorite={handleToggleFavorite}
                      favoriteBeats={favoriteBeats}
                    />
                  ) : (
                    <BeatList
                      beats={beats}
                      loading={loading}
                      currentPlayingBeat={currentBeat}
                      isPlaying={isPlaying}
                      onPlay={handlePlay}
                      onDownload={handleDownload}
                      filters={filters}
                      onToggleFavorite={handleToggleFavorite}
                      favoriteBeats={favoriteBeats}
                    />
                  )}
                </animated.div>
              ))
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default BeatsPage;