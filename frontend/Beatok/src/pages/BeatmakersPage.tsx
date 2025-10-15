import React, { useEffect, useState } from 'react';
import { userService, type Beatmaker } from '../services/userService';
import { getAvatarUrl } from '../utils/getAvatarURL';

const BeatmakersPage: React.FC = () => {
    const [beatmakers, setBeatmakers] = useState<Beatmaker[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBeatmakers();
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
        <div className="min-h-screen bg-neutral-900 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8">Битмейкеры</h1>

                {beatmakers.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-neutral-400 text-lg">Пока нет битмейкеров с битами</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {beatmakers.map((beatmaker) => (
                            <div
                                key={beatmaker.id}
                                className="bg-neutral-800 rounded-lg p-6 hover:bg-neutral-700 transition-colors duration-200 cursor-pointer group"
                                onClick={() => window.location.href = `/profile/${beatmaker.id}`}
                            >
                                <div className="flex items-center space-x-4">
                                    <img
                                        src={getAvatarUrl(beatmaker.id, beatmaker.avatar_path)}
                                        alt={beatmaker.username}
                                        className="w-16 h-16 rounded-full object-cover group-hover:scale-110 transition-transform duration-200"
                                        onError={(e) => {
                                            e.currentTarget.src = 'http://localhost:8000/static/default_avatar.png';
                                        }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-semibold truncate">{beatmaker.username}</h3>
                                        <p className="text-neutral-400 text-sm">
                                            {beatmaker.beat_count} бит{beatmaker.beat_count !== 1 ? 'ов' : ''}
                                        </p>
                                    </div>
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
