import React, { useEffect, useMemo, useState } from 'react';
import { userService, type Beatmaker } from '../services/userService';
import { getAvatarUrl } from '../utils/getAvatarURL';
import RoleBadge from '../components/UI/RoleBadge';
import SEO, { generateBreadcrumbSchema } from '../components/SEO';
import { apiUrl } from '../services/api';

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
      setAvatarKey((prev) => prev + 1);
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
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
    return beatmakers.filter((beatmaker) =>
      beatmaker.username.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [beatmakers, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-6">
        <section className="page-hero">
          <div className="section-heading">
            <div className="glass-pill w-fit">Загрузка авторов</div>
            <h1 className="text-4xl font-black text-white md:text-6xl">Битмейкеры</h1>
          </div>
        </section>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-panel animate-pulse p-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-white/8" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded-full bg-white/8" />
                  <div className="h-3 w-2/3 rounded-full bg-white/6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="БИТОК Битмейкеры"
        description="Топовые битмейкеры России и СНГ. Найдите своего продюсера, слушайте и покупайте их биты. Профили известных авторов битов, рэп-музыкантов и музыкальных продюсеров."
        keywords="битмейкеры, музыкальные продюсеры, рэп продюсеры, авторы битов, купить бит у продюсера, топ битмейкеры"
        url="/beatmakers"
        schema={generateBreadcrumbSchema([
          { name: 'БИТОК', url: '/' },
          { name: 'Р‘РёС‚РјРµР№РєРµСЂС‹', url: '/beatmakers' },
        ])}
      />

      <div className="space-y-6 select-none mt-4">
        <section className="page-hero">
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="section-heading">
              <div>
                <p className="section-kicker mb-3">Продюсеры, команды, звук</p>
                <h1 className="text-4xl font-black text-white md:text-6xl">Битмейкеры</h1>
              </div>
              <p className="section-summary">
                Находите продюсеров по вкусу, переходите в профиль, изучайте каталог и
                выбирайте биты напрямую у подходящего битмейкера.
              </p>
            </div>

            <div className="glass-panel-strong p-5">
              <label className="mb-2 block text-sm text-neutral-400">
                Поиск по нику
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск битмейкеров..."
                className="field-shell px-4 py-3"
              />

              <div className="page-metrics mt-5">
                <div className="metric-card">
                  <span className="metric-value">{beatmakers.length}</span>
                  <span className="metric-label">в каталоге</span>
                </div>
                <div className="metric-card">
                  <span className="metric-value">{filteredBeatmakers.length}</span>
                  <span className="metric-label">по запросу</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {beatmakers.length === 0 ? (
          <div className="section-shell p-10 text-center text-neutral-400">
            Пока нет битмейкеров с битами
          </div>
        ) : filteredBeatmakers.length === 0 ? (
          <div className="section-shell p-10 text-center text-neutral-400">
            Битмейкеры не найдены
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {filteredBeatmakers.map((beatmaker) => (
              <div
                key={beatmaker.id}
                className="section-shell cursor-pointer overflow-hidden transition duration-300 hover:-translate-y-1"
                onClick={() => {
                  window.location.href = `/profile/${beatmaker.id}`;
                }}
              >
                <div className="relative aspect-square overflow-hidden bg-white/4">
                  <img
                    src={`${getAvatarUrl(beatmaker.id, beatmaker.avatar_path)}?t=${avatarKey}`}
                    alt={beatmaker.username}
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = apiUrl('/static/default_avatar.png');
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </div>

                <div className="p-4">
                  <h3 className="flex items-center gap-2 truncate text-lg font-semibold text-white">
                    {beatmaker.username}
                    <RoleBadge role={beatmaker.role} showLabel={true} />
                  </h3>
                  <p className="mt-2 text-sm text-neutral-400">
                    {beatmaker.beat_count} бит{beatmaker.beat_count !== 1 ? 'ов' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default BeatmakersPage;
