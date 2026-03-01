import React, { useEffect, useState, useMemo } from 'react';
import { userService, type Beatmaker } from '../services/userService';
import { getAvatarUrl } from '../utils/getAvatarURL';

const BeatmakersPage: React.FC = () => {
    const [beatmakers, setBeatmakers] = useState<Beatmaker[]>([]);
    const [loading, setLoading] = useState(true);
    const [avatarKey, setAvatarKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBeatmakers();
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

    const loadBeatmakers = async () => {
        try {
          setLoading(true);
          const data = await userService.getAllBeatmakers();
          setBeatmakers(data);
        } catch (error) {
          console.error('Error loading beatmakers:', error);
        } finally {
          setLoading(false);
        }
    };

    const filteredBeatmakers = useMemo(() => {
        if (!searchQuery.trim()) {
            return beatmakers;
        }
        return beatmakers.filter(beatmaker =>
            beatmaker.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [beatmakers, searchQuery]);



    if (loading) {
      return (
        <div className="min-h-screen bg-neutral-900 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Битмейкеры</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-neutral-800 rounded-lg p-6 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-neutral-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-neutral-700 rounded mb-2"></div>
                      <div className="h-3 bg-neutral-700 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
        <div className="min-h-screen select-none p-6">
            <div className="max-w-7xl mx-auto">
                
                <div className='flex-column'>
                  <h1 className="text-3xl row font-bold text-white mb-8">Битмейкеры</h1>
                  <div className="mb-6 row">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Поиск битмейкеров..."
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4
                         py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors"
                    />
                </div>
                </div>
                

                {beatmakers.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-neutral-400 text-lg">Пока нет битмейкеров с битами</p>
                    </div>
                ) : filteredBeatmakers.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-neutral-400 text-lg">Битмейкеры не найдены</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {filteredBeatmakers.map((beatmaker) => (
                            <div
                                key={beatmaker.id}
                                className="bg-neutral-900 rounded-lg overflow-hidden hover:bg-neutral-800 transition-all duration-300 cursor-pointer group border border-neutral-700 relative hover:shadow-2xl hover:shadow-red-500/20"
                                onClick={() => window.location.href = `/profile/${beatmaker.id}`}
                            >
                                <div className="relative w-full aspect-square bg-neutral-800 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={`${getAvatarUrl(beatmaker.id, beatmaker.avatar_path)}?t=${avatarKey}`}
                                        alt={beatmaker.username}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        onError={(e) => {
                                            e.currentTarget.src = 'http://localhost:8000/static/default_avatar.png';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent"></div>
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
                )}
            </div>
        </div>
    );
};

export default BeatmakersPage;