import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PopularBeats from '../components/UI/home/PopularBeats';
import FeaturedBeats from '../components/UI/home/FeaturedBeats';
import TopBeatmakers from '../components/UI/home/TopBeatmakers';
import CallToAction from '../components/UI/home/CallToAction';
import Steps from '../components/UI/home/Steps';
import SecuritySection from '../components/UI/home/SecuritySection';
import Footer from '../components/UI/Footer';
import SEO, {
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generateWebsiteSchema,
} from '../components/SEO';
import { apiUrl } from '../services/api';

const HomePage: React.FC = () => {
  const heroImageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let frame = 0;
    const handleScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const image = heroImageRef.current;
        if (!image) return;
        const scale = Math.max(1, 1.5 - (window.scrollY / window.innerHeight) * 0.5);
        image.style.transform = `scale(${scale})`;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => { window.removeEventListener('scroll', handleScroll); if (frame) cancelAnimationFrame(frame); };
  }, []);

  return (
    <>
      <SEO
        title="БИТОК"
        description="БИТОК - Сервис для продажи и покупки битов. Каталог, поиск битмейкеров, демо и лицензии на биты для артистов и продюсеров."
        url="/"
        schema={[
          generateOrganizationSchema(),
          generateWebsiteSchema(),
          generateBreadcrumbSchema([{ name: 'Главная', url: '/' }]),
        ]}
      />

      <div className="min-h-screen w-full">
        <div className="page-shell">
          <section className="page-hero select-none mt-4">
            <img
              ref={heroImageRef}
              src={apiUrl('/static/images/homepage-bg.jpg')}
              alt="Homepage Background"
              className="absolute inset-0 h-full w-full object-cover opacity-35"
              style={{
                transform: 'scale(1.5)',
                transformOrigin: 'center center',
                willChange: 'transform',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/65 via-black/50 to-black/75" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.25fr_0.85fr] lg:items-start">
              <div className="section-heading">
                <div className="glass-pill w-fit ambient-float">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_18px_rgba(220,38,38,0.9)]" />
                  Биты для артистов и продюсеров
                </div>

                <div>
                  <p className="section-kicker mb-3">Каталог, продажа, поиск звука</p>
                  <h1 className="text-5xl font-black text-white md:text-7xl">
                    Биты для релизов.
                    <br />
                    Битмейкеры под ваш звук.
                  </h1>
                </div>

                <p className="section-summary text-base md:text-lg">
                  Платформа для покупки, продажи и поиска битов в СНГ. Слушайте демо,
                  сравнивайте цены, находите битмейкеров и собирайте каталог под свой звук.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link to="/beats" className="action-button-primary">
                    Смотреть каталог
                  </Link>
                  <Link to="/beatmakers" className="action-button-secondary">
                    Открыть битмейкеров
                  </Link>
                </div>
              </div>

              <div className="glass-panel-strong p-5 md:p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-neutral-400">
                      Площадка Beatok
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white">
                      Все инструменты для работы с битами
                    </h2>
                  </div>
                </div>

                <div className="page-metrics">
                  <div className="metric-card">
                    <span className="metric-value">24/7</span>
                    <span className="metric-label">Доступ к битам</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-value">Авторы</span>
                    <span className="metric-label">Поиск битмейкеров</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-value">Демо</span>
                    <span className="metric-label">Прослушивание до покупки</span>
                  </div>

                </div>

                <div className="soft-divider my-5" />

                <div className="grid gap-3 text-sm text-neutral-300">
                  <div className="glass-panel p-4">
                    Открывайте каталог, слушайте демо, добавляйте подходящие биты в
                    избранное и возвращайтесь к ним позже.
                  </div>
                  <div className="glass-panel p-4">
                    Находите авторов, переходите в их профили, следите за новыми
                    работами и собирайте рабочие музыкальные связи.
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="page-shell space-y-6">
          <FeaturedBeats />
          <PopularBeats />
        </div>

        <CallToAction />

        <div className="page-shell space-y-6">
          <TopBeatmakers />
          <SecuritySection />
          <Steps />
        </div>

        <Footer />
      </div>
    </>
  );
};

export default HomePage;
