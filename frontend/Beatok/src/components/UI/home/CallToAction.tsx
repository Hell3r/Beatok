import React from 'react';

const CallToAction: React.FC = () => {
  return (
    <div 
      style={{
        backgroundImage: 'url("http://localhost:8000/static/images/first-beat-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      className="w-full p-8 text-center overflow-hidden min-h-[400px] flex items-center justify-center relative"
    >
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