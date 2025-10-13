import React, { useState, useEffect } from 'react';
import { userService, type TopBeatmaker } from '../../../services/userService';

const TopBeatmakers: React.FC = () => {
  const [beatmakers, setBeatmakers] = useState<TopBeatmaker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopBeatmakers();
  }, []);

  const loadTopBeatmakers = async () => {
    try {
      setLoading(true);
      const data = await userService.getTopBeatmakers(6);
      setBeatmakers(data);
    } catch (error) {
      console.error('Error loading top beatmakers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = (avatarPath?: string) => {
    if (!avatarPath) {
      return 'http://localhost:8000/static/default_avatar.png';
    }
    if (avatarPath.startsWith('http')) {
      return avatarPath;
    }
    if (avatarPath === 'default_avatar.png' || avatarPath === 'static/default_avatar.png') {
      return 'http://localhost:8000/static/default_avatar.png';
    }
    return `http://localhost:8000/v1/users/${avatarPath}`;
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
    <div className="bg-neutral-900 p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Лучшие битмейкеры</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {beatmakers.map((beatmaker, index) => (
          <div
            key={beatmaker.user_id}
            className="bg-neutral-700 rounded-lg p-4 hover:bg-neutral-600 transition-colors duration-200 cursor-pointer group"
            onClick={() => window.location.href = '/beatmakers'}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={getAvatarUrl(beatmaker.avatar_path)}
                  alt={beatmaker.username}
                  className="w-12 h-12 rounded-full object-cover group-hover:scale-110 transition-transform duration-200"
                  onError={(e) => {
                    e.currentTarget.src = 'http://localhost:8000/static/default_avatar.png';
                  }}
                />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {index + 1}
                </div>
              </div>
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
      <div className="mt-6 text-center">
        <a
          href="/beatmakers"
          className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
        >
          Посмотреть всех битмейкеров
        </a>
      </div>
    </div>
  );
};

export default TopBeatmakers;
