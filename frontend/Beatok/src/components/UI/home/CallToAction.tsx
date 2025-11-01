import React, { useState, useEffect, useRef } from 'react';

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
    <div className="w-full p-8 text-center overflow-hidden min-h-[400px] flex items-center justify-center relative">
      <img
        ref={imgRef}
        src="http://localhost:8000/static/images/first-beat-bg.jpg"
        alt="First Beat Background"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.1s ease-out'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-black/70"></div>

      <div className="relative z-10 max-w-4xl">
        <h2 className="text-3xl font-bold text-white mb-4">
          Готов создать свой первый бит?
        </h2>
        <p className="text-gray-100 mb-8 max-w-2xl mx-auto text-lg">
          Присоединяйтесь к сообществу битмейкеров СНГ! Делитесь своими треками,
          получайте обратную связь и находите вдохновение в работах других продюсеров.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/forum"
            className="inline-block bg-white text-red-600 hover:bg-gray-300 px-8 py-3 rounded-md font-semibold transition-colors duration-200 shadow-lg"
          >
            Перейти на форум
          </a>
          <a
            href="/beats"
            className="inline-block bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-md font-semibold transition-colors duration-200 shadow-lg"
          >
            Посмотреть биты
          </a>
        </div>
      </div>
    </div>
  );
};

export default CallToAction;