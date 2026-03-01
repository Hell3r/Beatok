import React, { useState, useEffect } from 'react';
import { beatService } from '../../../services/beatService';
import { useAudioPlayer } from '../../../hooks/useAudioPlayer';
import type { Beat } from '../../../types/Beat';
import BeatList from '../beats/BeatList';
import type { Filters } from '../beats/Filter';

const PopularBeats: React.FC = () => {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteBeats, setFavoriteBeats] = useState<Beat[]>([]);
  const { setBeats: setGlobalBeats, currentBeat, isPlaying, playBeat, toggleFavorite } = useAudioPlayer();

  const handlePlay = (beat: Beat) => {
    playBeat(beat);
  };

  const handleDownload = (beat: Beat) => {
    console.log('Download beat:', beat.id);
  };

  const handleToggleFavorite = async (beat: Beat) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      const event = new CustomEvent('openAuthModal');
      window.dispatchEvent(event);
      return;
    }
    await toggleFavorite(beat);
    loadFavoriteBeats();
  };

  const filters: Filters = {
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
    loadPopularBeats();
    loadFavoriteBeats();
  }, []);

  const loadPopularBeats = async () => {
    try {
      setLoading(true);
      const data = await beatService.getBeats(0, 7);
      const availableBeats = data.filter(beat => beat.status === 'available');
      availableBeats.sort((a, b) => b.likes_count - a.likes_count);
      setBeats(availableBeats);
      setGlobalBeats(availableBeats);
    } catch (error) {
      console.error('Error loading popular beats:', error);
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


  if (loading) {
    return (
      <div className="bg-neutral-800 rounded-lg p-6 w-full">
        <h2 className="text-2xl font-bold text-white mb-4">Популярные биты</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-neutral-800 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-neutral-700 rounded mb-2"></div>
              <div className="h-3 bg-neutral-700 rounded mb-1"></div>
              <div className="h-3 bg-neutral-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-925 p-6 w-full">
      <div className="w-full px-4 py-4">
        <div className="text-center justify-center">
          <div className="text-3xl font-bold text-white mb-2">Популярные биты</div>
          <div className="text-gray-300">Выбери подходящий бит для своего трека среди самых качественных.</div>
          <hr className='text-red-500 my-4 mx-auto border max-w-200'/>
        </div>
      </div>
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
      <div className="mt-6 text-center">
        <a
          href="/beats"
          className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
        >
          Посмотреть все биты
        </a>
      </div>
    </div>
  );
};

export default PopularBeats;
