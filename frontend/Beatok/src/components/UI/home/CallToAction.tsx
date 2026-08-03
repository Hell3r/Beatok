import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiUrl } from '../../../services/api';

const CallToAction: React.FC = () => {
  const [scale, setScale] = useState(1.5);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!imgRef.current) return;
      const rect = imgRef.current.getBoundingClientRect();

      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const progress = (window.innerHeight - rect.top) / window.innerHeight;
        const newScale = Math.max(1, 1.5 - progress * 0.5);
        setScale(newScale);
      } else {
        setScale(1.5);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative min-h-[320px] w-full overflow-hidden py-6">
      <img
        ref={imgRef}
        src={apiUrl('/static/images/first-beat-bg.jpg')}
        alt="First Beat Background"
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.1s ease-out',
        }}
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,10,0.46),rgba(4,6,10,0.3)_20%,rgba(4,6,10,0.6)_100%),radial-gradient(circle_at_center,rgba(220,38,38,0.18),transparent_42%)]" />

      <div className="relative z-10 mx-auto flex min-h-[320px] w-full max-w-[1320px] items-center justify-center px-6 text-center">
        <div className="glass-panel-strong max-w-4xl rounded-[34px] px-8 py-7 shadow-[0_30px_90px_rgba(0,0,0,0.3)] backdrop-blur-xl md:px-12 md:py-8">
          <h2 className="mb-4 text-3xl font-bold text-white">Готов создать свой первый бит?</h2>
          <p className="mx-auto mb-6 max-w-2xl text-base text-gray-100 md:text-lg">
            Присоединяйтесь к сообществу битмейкеров СНГ! Делитесь своими треками, получайте
            обратную связь и находите вдохновение в работах других продюсеров.
          </p>

          <div className="flex justify-center">
            <Link to="/beats" className="action-button-primary">
              Посмотреть биты
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
