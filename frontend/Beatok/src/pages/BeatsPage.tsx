import React, { useEffect, useMemo, useState } from 'react';
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
import { apiUrl } from '../services/api';

type ViewMode = 'table' | 'grid';

const BeatsPage: React.FC = () => {
  const [beats, setBeatsLocal] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('beatsViewMode');
    return saved === 'table' || saved === 'grid' ? saved : 'grid';
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    name: '',
    author: '',
    genre: '',
    bpm: '',
    key: '',
    minPrice: '',
    maxPrice: '',
    freeOnly: false,
  });
  const [favoriteBeats, setFavoriteBeats] = useState<Beat[]>([]);

  const { playBeat, currentBeat, isPlaying, togglePlayPause, setBeats } = useAudioPlayer();

  const transitions = useTransition(viewMode, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: { duration: 250 },
  });

  const handleViewModeChange = (newViewMode: ViewMode) => {
    setViewMode(newViewMode);
    localStorage.setItem('beatsViewMode', newViewMode);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const freeParam = urlParams.get('free');
    if (freeParam === 'true') {
      setFilters((previous) => ({ ...previous, freeOnly: true }));
    }

    loadBeats();
    loadFavoriteBeats();
  }, []);

  const loadBeats = async () => {
    try {
      setLoading(true);
      const data = await beatService.getBeats();
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
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }

    try {
      const isFavorite = favoriteBeats.some((favoriteBeat) => favoriteBeat.id === beat.id);
      if (isFavorite) {
        await beatService.removeFromFavorites(beat.id);
        setFavoriteBeats((previous) =>
          previous.filter((favoriteBeat) => favoriteBeat.id !== beat.id),
        );
      } else {
        await beatService.toggleFavorite(beat.id);
        setFavoriteBeats((previous) => [...previous, beat]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handlePlay = async (beat: Beat) => {
    if (currentBeat?.id === beat.id) {
      togglePlayPause();
      return;
    }

    playBeat(beat);
  };

  const isFreeBeat = (beat: Beat): boolean => {
    if (!beat.pricings || beat.pricings.length === 0) return true;
    const availablePrices = beat.pricings.filter(
      (pricing) => pricing.price !== null && pricing.is_available,
    );
    if (availablePrices.length === 0) return true;
    return Math.min(...availablePrices.map((pricing) => pricing.price!)) === 0;
  };

  const getBeatMinPrice = (beat: Beat): number | null => {
    if (!beat.pricings || beat.pricings.length === 0) return null;
    const availablePrices = beat.pricings.filter(
      (pricing) => pricing.price !== null && pricing.is_available,
    );
    if (availablePrices.length === 0) return null;
    return Math.min(...availablePrices.map((pricing) => pricing.price!));
  };

  const availableBeats = useMemo(
    () => (Array.isArray(beats) ? beats.filter((beat) => beat.status === 'available') : []),
    [beats],
  );

  const filteredBeatsCount = useMemo(() => {
    return availableBeats.filter((beat) => {
      if (filters.name) {
        const searchLower = filters.name.toLowerCase();
        const nameMatch = beat.name.toLowerCase().includes(searchLower);
        const tagMatch = beat.tags?.some((tag) => tag.name.toLowerCase().includes(searchLower));
        if (!nameMatch && !tagMatch) return false;
      }

      const authorName =
        beat.owner?.username || beat.author?.username || beat.user?.username || '';
      if (filters.author && !authorName.toLowerCase().includes(filters.author.toLowerCase())) {
        return false;
      }

      if (filters.genre && !beat.genre.toLowerCase().includes(filters.genre.toLowerCase())) {
        return false;
      }

      if (filters.bpm && !beat.tempo.toString().includes(filters.bpm)) {
        return false;
      }

      if (filters.key && beat.key !== filters.key) {
        return false;
      }

      if (filters.freeOnly && !isFreeBeat(beat)) {
        return false;
      }

      const beatMinPrice = getBeatMinPrice(beat);

      if (!filters.freeOnly && filters.minPrice) {
        const minPrice = parseFloat(filters.minPrice);
        if (beatMinPrice === null || beatMinPrice < minPrice) {
          return false;
        }
      }

      if (!filters.freeOnly && filters.maxPrice) {
        const maxPrice = parseFloat(filters.maxPrice);
        if (beatMinPrice === null || beatMinPrice > maxPrice) {
          return false;
        }
      }

      return true;
    }).length;
  }, [availableBeats, filters]);

  const activeFiltersCount = useMemo(
    () => Object.values(filters).filter((value) => value !== '' && value !== false).length,
    [filters],
  );

  const handleDownload = async (beat: Beat) => {
    const token = localStorage.getItem('access_token');

    if (isFreeBeat(beat) && !token) {
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }

    try {
      await fetch(apiUrl(`/beats/${beat.id}/increment-download`), {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
      });

      const urlResponse = await fetch(apiUrl(`/beats/${beat.id}/audio-url`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!urlResponse.ok) {
        const errorText = await urlResponse.text();
        throw new Error(`Failed to get audio URL: ${urlResponse.status} ${errorText}`);
      }

      const data = await urlResponse.json();
      const { audio_url, audio_format } = data;
      const fileResponse = await fetch(audio_url);

      if (!fileResponse.ok) {
        throw new Error(`Failed to download file: ${fileResponse.status}`);
      }

      const blob = await fileResponse.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${beat.name}.${audio_format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Ошибка при скачивании файла');
    }
  };

  return (
    <>
      <SEO
        title={filters.freeOnly ? 'Бесплатные биты' : 'Каталог битов'}
        description={
          filters.freeOnly
            ? 'Скачай бесплатные биты для рэпа и музыки. Большая коллекция бесплатных минусов от топовых битмейкеров СНГ.'
            : 'Купить и скачать биты для рэпа, роки, поп-музыки. Каталог качественных битов от битмейкеров России и СНГ. Фильтры по жанру, BPM, тональности.'
        }
        keywords={
          filters.freeOnly
            ? 'бесплатные биты, бесплатные минуса, скачать бесплатно биты, бесплатные биты для рэпа'
            : 'биты, купить биты, минуса, биты для рэпа, каталог битов, купить минус'
        }
        url={filters.freeOnly ? '/beats?free=true' : '/beats'}
        schema={generateBreadcrumbSchema([
          { name: 'Главная', url: '/' },
          { name: filters.freeOnly ? 'Бесплатные биты' : 'Биты', url: '/beats' },
        ])}
      />

      <div className="space-y-6 select-none mt-4">
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="sticky top-28 hidden self-start overflow-visible xl:block">
            <Filter filters={filters} onFiltersChange={setFilters} />
          </aside>

          <div className="space-y-4" id="beats-results">
            <div className="glass-panel-strong p-4 md:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="section-kicker mb-2">Каталог битов</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm text-neutral-300">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      {loading ? 'Загрузка...' : `${filteredBeatsCount} из ${availableBeats.length}`}
                    </span>
                    {activeFiltersCount > 0 && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        Фильтров: {activeFiltersCount}
                      </span>
                    )}
                    {favoriteBeats.length > 0 && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        Избранное: {favoriteBeats.length}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(true)}
                    className="action-button-secondary action-button-slim xl:hidden"
                  >
                    <FaFilter className="h-4 w-4" />
                    Фильтры
                  </button>
                  <div className="hidden md:block">
                    <ViewToggle currentView={viewMode} onViewChange={handleViewModeChange} />
                  </div>
                </div>
              </div>
            </div>

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
                maxColumns={5}
              />
            </div>

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
                      maxColumns={5}
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

        <div
          className={`fixed inset-0 z-[70] bg-black/[0.55] backdrop-blur-md transition-opacity duration-300 md:hidden ${
            isFilterOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onClick={() => setIsFilterOpen(false)}
        >
          <div
            className={`absolute left-0 top-0 h-full w-[88vw] max-w-[360px] overflow-y-auto p-3 transition-transform duration-300 ${
              isFilterOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="nav-shell h-full p-3">
              <div className="mb-3 flex items-center justify-between rounded-[22px] border border-white/[0.08] bg-white/[0.04] px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Фильтры</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">Настройка каталога</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-neutral-200 transition hover:border-white/[0.16] hover:bg-white/[0.08] hover:text-white"
                >
                  Закрыть
                </button>
              </div>
              <Filter filters={filters} onFiltersChange={setFilters} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BeatsPage;
