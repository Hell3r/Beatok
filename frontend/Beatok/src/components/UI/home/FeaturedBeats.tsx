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
  }, []);

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
          <div className="text-center text-gray-400">
            Пока нет продвигаемых битов
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-925 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 select-none">
          <h2 className="text-3xl font-bold text-white mb-2">В центре внимания</h2>
          <p className="text-gray-300">Особые биты от наших лучших продюсеров</p>
          <hr className="text-red-500 my-4 mx-auto border max-w-200" />
        </div>
        <BeatList
          beats={featuredBeats}
          loading={loading}
          currentPlayingBeat={currentBeat}
          isPlaying={isPlaying}
          onPlay={handlePlay}
          filters={filters}
          onToggleFavorite={handleToggleFavorite}
          favoriteBeats={favoriteBeats}
          maxColumns={5}
        />
      </div>
    </div>
  );
};

export default FeaturedBeats;
