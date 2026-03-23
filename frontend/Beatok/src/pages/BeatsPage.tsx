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
import SEO, { generateBreadcrumbSchema } from '../components/SEO';

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

  const isFreeBeat = (beat: Beat): boolean => {
    if (!beat.pricings || beat.pricings.length === 0) return true;
    const availablePrices = beat.pricings.filter(p => p.price !== null && p.is_available);
    if (availablePrices.length === 0) return true;
    return Math.min(...availablePrices.map(p => p.price!)) === 0;
  };

  const handleDownload = async (beat: Beat) => {
  const token = localStorage.getItem("access_token");
  const API_BASE_URL = 'http://185.55.59.6/:8000';

  if (isFreeBeat(beat) && !token) {
    const event = new CustomEvent('openAuthModal');
    window.dispatchEvent(event);
    return;
  }

  try {
    console.log('Increment download for beat', beat.id);
    const incResponse = await fetch(`http://185.55.59.6/:8000/beats/${beat.id}/increment-download`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Increment response status:', incResponse.status);

    console.log('Fetching audio URL from:', `${API_BASE_URL}/beats/${beat.id}/audio-url`);
    const urlResponse = await fetch(`${API_BASE_URL}/beats/${beat.id}/audio-url`);
    console.log('Audio URL response status:', urlResponse.status);
    
    if (!urlResponse.ok) {
      const errorText = await urlResponse.text();
      throw new Error(`Failed to get download URL: ${urlResponse.status} - ${errorText}`);
    }
    
    const data = await urlResponse.json();
    console.log('Received audio data:', data);
    const { audio_url, audio_format } = data;

    console.log('Downloading file from:', audio_url);
    const fileResponse = await fetch(audio_url);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.status}`);
    }
    const blob = await fileResponse.blob();

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${beat.name}.${audio_format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
    alert('Ошибка при скачивании файла');
  }
};



  return (
    <>
      <SEO 
        title={filters.freeOnly ? 'Бесплатные биты' : 'Каталог битов'}
        description={filters.freeOnly 
          ? 'Скачай бесплатные биты для рэпа и музыки. Большая коллекция бесплатных минусов от топовых битмейкеров СНГ.'
          : 'Купить и скачать биты для рэпа, роки, поп-музыки. Каталог качественных битов от битмейкеров России и СНГ. Фильтры по жанру, BPM, тональности.'
        }
        keywords={filters.freeOnly 
          ? 'бесплатные биты, бесплатные минуса, скачать бесплатно биты, бесплатные биты для рэпа'
          : 'биты, купить биты, минуса, биты для рэпа, каталог битов, купить минус'
        }
        url={filters.freeOnly ? '/beats?free=true' : '/beats'}
        schema={generateBreadcrumbSchema([
          { name: 'Главная', url: '/' },
          { name: filters.freeOnly ? 'Бесплатные биты' : 'Биты', url: '/beats' }
        ])}
      />
      <div className="min-h-screen">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <p className="text-neutral-400">
              Всего битов: <span className="text-white font-semibold">{beats.filter(beat => beat.status === 'available').length}</span>
            </p>
            {currentBeat && (
              <p className="text-xs text-neutral-500 mt-1">
                Текущий: {currentBeat.name}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="hidden md:block">
              <ViewToggle currentView={viewMode} onViewChange={handleViewModeChange} />
            </div>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="md:hidden bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
              title="Фильтры"
            >
              <FaFilter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="hidden lg:block lg:w-80 flex-shrink-0 sticky top-22 self-start">
            <Filter filters={filters} onFiltersChange={setFilters} />
          </div>

          <div className="md:hidden">
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
              <div className="md:hidden">
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
                  maxColumns={4}
                />
              </div>
            )}
            <div className="hidden md:block">
              {transitions((style, item) => (
                <animated.div style={style}>
                  {item === 'grid' ? (
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
                      maxColumns={4}
                    />
                  ) : (
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
                  )}
                </animated.div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
    </>
  );
};

export default BeatsPage;
