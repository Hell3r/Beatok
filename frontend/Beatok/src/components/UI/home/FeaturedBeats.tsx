import React, { useEffect, useState } from 'react';
import { beatService } from '../../../services/beatService';
import type { Beat } from '../../../types/Beat';
import BeatList from '../beats/BeatList';
import { useAudioPlayer } from '../../../hooks/useAudioPlayer';

const FeaturedBeats: React.FC = () => {
  const [featuredBeats, setFeaturedBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const { playBeat, currentBeat, isPlaying, toggleFavorite, favoriteBeats, setBeats: setGlobalBeats } = useAudioPlayer();

  const handlePlay = (beat: Beat) => {
    playBeat(beat);
  };

  const handleToggleFavorite = async (beat: Beat) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      const event = new CustomEvent('openAuthModal');
      window.dispatchEvent(event);
      return;
    }
    await toggleFavorite(beat);
  };

  const isFreeBeat = (beat: Beat): boolean => {
    if (!beat.pricings || beat.pricings.length === 0) return true;
    const availablePrices = beat.pricings.filter(p => p.price !== null && p.is_available);
    if (availablePrices.length === 0) return true;
    return Math.min(...availablePrices.map(p => p.price!)) === 0;
  };

  const getAudioFormat = (beat: Beat): string => {
    if (!beat.audio_file_path) return '';
    return beat.audio_file_path.split('.').pop()?.toUpperCase() || '';
  };

  const handleDownload = async (beat: Beat) => {
    const token = localStorage.getItem("access_token");
    
    if (isFreeBeat(beat) && !token) {
      const event = new CustomEvent('openAuthModal');
      window.dispatchEvent(event);
      return;
    }
    
    try {
        await fetch(`http://185.55.59.6:8000/beats/${beat.id}/increment-download`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.log('Не удалось увеличить счетчик скачиваний, но продолжаем скачивание:', error);
    }

    if (!beat.audio_file_path) {
      alert('Аудиофайл не найден');
      return;
    }

    const baseUrl = 'http://185.55.59.6:8000';
    const audioUrl = `${baseUrl}/audio_storage/${beat.audio_file_path}`;
    const fileExtension = beat.audio_file_path.split('.').pop()?.toLowerCase() || 'mp3';

    try {
      const response = await fetch(audioUrl);
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
  };

  const filters = {
    name: '',
    author: '',
    genre: '',
    bpm: '',
    key: '',
    minPrice: '',
    maxPrice: '',
    freeOnly: false,
  };

  useEffect(() => {
    const fetchPromotedBeats = async () => {
      try {
        const beats = await beatService.getPromotedBeats();
        setFeaturedBeats(beats);
        setGlobalBeats(beats);
      } catch (error) {
        console.error('Failed to fetch promoted beats:', error);
        setFeaturedBeats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotedBeats();
  }, [setGlobalBeats]);

  if (loading) {
    return (
      <div className="bg-neutral-925 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 select-none">
            <h2 className="text-3xl font-bold text-white mb-2">В центре внимания</h2>
            <p className="text-gray-300">Особые биты от наших лучших продюсеров</p>
            <hr className="text-red-500 my-4 mx-auto border max-w-200" />
          </div>
          <div className="flex justify-center">
            <div className="text-white">Загрузка...</div>
          </div>
        </div>
      </div>
    );
  }

  if (featuredBeats.length === 0) {
    return (
      <div className="bg-neutral-925 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 select-none">
            <h2 className="text-3xl font-bold text-white mb-2">В центре внимания</h2>
            <p className="text-gray-300">Особые биты от наших лучших продюсеров</p>
            <hr className="text-red-500 my-4 mx-auto border max-w-200" />
          </div>
          <div className="text-center text-gray-400 select-none">
            Пока нет продвигаемых битов
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-925 p-6 w-full">
      <div className="w-full px-4">
        <div className="text-center mb-8 select-none">
          <h2 className="text-3xl font-bold text-white mb-2">В центре внимания</h2>
          <p className="text-gray-300">Особые биты от наших лучших продюсеров</p>
          <hr className="text-red-500 my-4 mx-auto border max-w-200" />
        </div>
      </div>
      <BeatList
        beats={featuredBeats}
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
  );
};

export default FeaturedBeats;