import React, { useEffect, useState } from 'react';
import { beatService } from '../../../services/beatService';
import type { Beat } from '../../../types/Beat';
import BeatPurchaseModal from '../../BeatPurchaseModal';
import { truncateText } from '../../../utils/truncateText';
import { formatDuration } from '../../../utils/formatDuration';
import { useAudioPlayer } from '../../../hooks/useAudioPlayer';


const FeaturedBeats: React.FC = () => {
  const [featuredBeats, setFeaturedBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [beatToPurchase, setBeatToPurchase] = useState<Beat | null>(null);

  const { playBeat, currentBeat, isPlaying, toggleFavorite, favoriteBeats } = useAudioPlayer();

  const isFree = (beat: Beat): boolean => {
    if (!beat.pricings || beat.pricings.length === 0) return true;
    const availablePrices = beat.pricings.filter(p => p.price !== null && p.is_available);
    if (availablePrices.length === 0) return true;
    return Math.min(...availablePrices.map(p => p.price!)) === 0;
  };



  useEffect(() => {
    const fetchPromotedBeats = async () => {
      try {
        const beats = await beatService.getPromotedBeats();
        setFeaturedBeats(beats);
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
    <>
      <div className="bg-neutral-925 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 select-none">
            <h2 className="text-3xl font-bold text-white mb-2">В центре внимания</h2>
            <p className="text-gray-300">Особые биты от наших лучших продюсеров</p>
            <hr className="text-red-500 my-4 mx-auto border max-w-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredBeats.map((beat) => (
              <div
                key={beat.id}
                className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl p-6 shadow-lg hover:shadow-2xl hover:bg-gradient-to-br hover:from-neutral-700 hover:to-neutral-800 transition-colors duration-700 border border-neutral-700 group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-full border-4 border-yellow-500 overflow-hidden select-none">
                      <img
                        src={beat.author?.avatar_path ? `http://localhost:8000/static/avatars/${beat.author.avatar_path}` : 'http://localhost:8000/static/default_avatar.png'}
                        alt={`Аватар ${beat.author?.username || 'Автор'}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'http://localhost:8000/static/default_avatar.png';
                        }}
                      />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-black text-xs font-bold select-none">★</span>
                    </div>
                  </div>

                  <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-red-400 transition-colors">
                    {beat.name}
                  </h3>
                  <p className="text-neutral-400 text-sm mb-4">by {beat.author?.username || 'Неизвестный'}</p>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm w-full">
                    <div className="text-neutral-300 truncate" title={beat.genre}>
                      <span className="text-neutral-500">Жанр:</span> {truncateText(beat.genre, 12)}
                    </div>
                    <div className="text-neutral-300">
                      <span className="text-neutral-500">Темп:</span> {beat.tempo} BPM
                    </div>
                    <div className="text-neutral-300 truncate" title={beat.key}>
                      <span className="text-neutral-500">Тональность:</span> {beat.key}
                    </div>
                    <div className="text-neutral-300">
                      <span className="text-neutral-500">Длина:</span> {formatDuration(beat.duration)}
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <button
                      onClick={() => playBeat(beat)}
                      className={`${
                        currentBeat?.id === beat.id && isPlaying
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-red-600 hover:bg-red-700'
                      } text-white p-3 rounded-full transition-colors cursor-pointer`}
                      title={currentBeat?.id === beat.id && isPlaying ? "Пауза" : "Воспроизвести"}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        {currentBeat?.id === beat.id && isPlaying ? (
                          <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                        ) : (
                          <path d="M8 5v14l11-7z"/>
                        )}
                      </svg>
                    </button>

                    {isFree(beat) ? (
                      <button
                        className="bg-neutral-700 hover:bg-neutral-600 text-white px-6 py-2 rounded-full transition-colors cursor-pointer relative"
                        style={{ minWidth: '120px' }}
                        title="Скачать"
                      >
                        Скачать
                        <div className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-1 py-0.5 rounded">
                          Бесплатно
                        </div>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setBeatToPurchase(beat);
                          setPurchaseModalOpen(true);
                        }}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-full transition-colors cursor-pointer"
                        style={{ minWidth: '120px' }}
                        title="Купить"
                      >
                        от {Math.min(...beat.pricings!.filter(p => p.price !== null && p.is_available).map(p => p.price!))} ₽
                      </button>
                    )}

                    <button
                      onClick={() => {
                        const token = localStorage.getItem('access_token');
                        if (!token) {
                          const event = new CustomEvent('openAuthModal');
                          window.dispatchEvent(event);
                          return;
                        }
                        toggleFavorite(beat);
                      }}
                      className={`p-3 rounded-full transition-colors cursor-pointer ${
                        favoriteBeats.some(fav => fav.id === beat.id) ? 'text-red-500' : 'text-white hover:bg-neutral-700'
                      }`}
                      title={favoriteBeats.some(fav => fav.id === beat.id) ? 'Убрать из избранного' : 'Добавить в избранное'}
                    >
                      <svg className="w-4 h-4" fill={favoriteBeats.some(fav => fav.id === beat.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BeatPurchaseModal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        beat={beatToPurchase}
      />
    </>
  );
};

export default FeaturedBeats;
