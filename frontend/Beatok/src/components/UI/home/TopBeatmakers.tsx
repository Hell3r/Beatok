import React, { useState, useEffect } from 'react';
import { userService, type TopBeatmaker } from '../../../services/userService';
import { getAvatarUrl } from '../../../utils/getAvatarURL';

const TopBeatmakers: React.FC = () => {
  const [beatmakers, setBeatmakers] = useState<TopBeatmaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarKey, setAvatarKey] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');

  useEffect(() => {
    loadTopBeatmakers();
  }, []);

  useEffect(() => {
    const handleUserUpdate = () => {
      setAvatarKey(prev => prev + 1);
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  const loadTopBeatmakers = async () => {
    try {
      setLoading(true);
      const data = await userService.getTopBeatmakers(10);
      setBeatmakers(data);
    } catch (error) {
      console.error('Error loading top beatmakers:', error);
    } finally {
      setLoading(false);
    }
  };

  const visibleBeatmakers = beatmakers.slice(currentIndex, currentIndex + 5).concat(
    beatmakers.slice(0, Math.max(0, (currentIndex + 5) - beatmakers.length))
  );

  const handlePrev = async () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + beatmakers.length) % beatmakers.length);

    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleNext = async () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % beatmakers.length);

    setTimeout(() => setIsTransitioning(false), 300);
  };

  if (loading) {
    return (
      <div className="bg-neutral-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Лучшие битмейкеры</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-neutral-700 rounded-lg p-4 animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-neutral-600 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-neutral-600 rounded mb-2"></div>
                  <div className="h-3 bg-neutral-600 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-925 p-6">
      <div className="container mx-auto px-4 py-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-white mb-2">Лучшие битмейкеры</div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 mb-4"
          >
            ПОДДЕРЖАТЬ АВТОРОВ
          </button>
          <div className="text-gray-300">Слушай активных битмейкеров, которые лучше всех реализовали свой талант.</div>
          <hr className='text-red-500 my-4 mx-auto border max-w-200'/>
        </div>
      </div>
      
      <div className="relative px-10">
        <button
          onClick={handlePrev}
          disabled={isTransitioning}
          className="absolute cursor-pointer left-0 top-1/2 transform -translate-y-1/2 h-32 w-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 z-10 group"
        >
          <div className="relative">
            <div className="text-3xl font-light group-hover:scale-105 transition-transform duration-300">‹</div>
            <div className="absolute inset-0 from-white/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </button>

        <div className={`grid grid-cols-5 gap-6 transition-all duration-300 ${
          isTransitioning ? 'opacity-50' : 'opacity-100'
        }`}>
          {visibleBeatmakers.map((beatmaker, index) => (
            <div
              key={`${beatmaker.user_id}-${currentIndex}`}
              className="bg-neutral-900 rounded-lg overflow-hidden hover:bg-neutral-800 transition-all duration-300 cursor-pointer group border border-neutral-700 relative hover:shadow-2xl hover:shadow-red-500/20"
              onClick={() => window.location.href = `/profile/${beatmaker.user_id}`}
            >
              <div className="relative w-full aspect-square bg-neutral-800 flex items-center justify-center overflow-hidden">
                <img
                  src={`${getAvatarUrl(beatmaker.user_id, beatmaker.avatar_path)}?t=${avatarKey}`}
                  alt={beatmaker.username}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.src = 'http://localhost:8000/static/default_avatar.png'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent"></div>
                
                <div className="absolute top-3 right-3 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold transition-transform duration-300 shadow-lg">
                  {(currentIndex + index) % beatmakers.length + 1}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-white font-semibold text-lg truncate group-hover:text-red-400 transition-colors duration-300">
                  {beatmaker.username}
                </h3>
                <p className="text-neutral-400 text-sm group-hover:text-neutral-300 transition-colors duration-300 mt-1">
                  {beatmaker.beat_count} бит{beatmaker.beat_count !== 1 ? 'ов' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={isTransitioning}
          className="absolute cursor-pointer right-0 top-1/2 transform -translate-y-1/2 h-32 w-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 z-10 group"
        >
          <div className="relative">
            <div className="text-3xl font-light group-hover:scale-105 transition-transform duration-300">›</div>
            <div className="absolute inset-0 cursor-pointer from-white/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </button>
      </div>

      <div className="mt-6 text-center">
        <a
          href="/beatmakers"
          className="inline-block bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300"
        >
          Посмотреть всех битмейкеров
        </a>
      </div>
    </div>
  );
};

export default TopBeatmakers;
