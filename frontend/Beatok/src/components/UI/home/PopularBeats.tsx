import React, { useState, useEffect } from 'react';
import { beatService } from '../../../services/beatService';
import type { Beat } from '../../../types/Beat';

const PopularBeats: React.FC = () => {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPopularBeats();
  }, []);

  const loadPopularBeats = async () => {
    try {
      setLoading(true);
      const data = await beatService.getBeats(0, 6);
      setBeats(data);
    } catch (error) {
      console.error('Error loading popular beats:', error);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="bg-neutral-800 rounded-lg p-6 w-full">
        <h2 className="text-2xl font-bold text-white mb-4">Популярные биты</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-neutral-700 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-neutral-600 rounded mb-2"></div>
              <div className="h-3 bg-neutral-600 rounded mb-1"></div>
              <div className="h-3 bg-neutral-600 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 p-6 w-full">
      <h2 className="text-2xl font-bold text-white mb-4">Популярные биты</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {beats.map((beat) => (
          <div
            key={beat.id}
            className="bg-neutral-700 rounded-lg p-4 hover:bg-neutral-600 transition-colors duration-200 cursor-pointer group"
            onClick={() => window.location.href = '/beats'}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <span className="text-white font-bold text-sm">♪</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold truncate text-sm">{beat.name}</h3>
                <p className="text-neutral-400 text-xs truncate">
                  {beat.owner?.username || beat.author?.username || 'Неизвестный'}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-neutral-400">
              <span>{beat.genre}</span>
              <span>{beat.tempo} BPM</span>
            </div>
            <div className="mt-2 flex justify-between items-center text-xs text-neutral-500">
              <span>{Math.floor(beat.duration / 60)}:{(beat.duration % 60).toFixed(0).padStart(2, '0')}</span>
              <span>{beat.key}</span>
            </div>
          </div>
        ))}
      </div>
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
