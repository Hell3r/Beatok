import React from 'react';

const Steps: React.FC = () => {
  return (
    <div>
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">🚀 Твой путь в мире битмейкинга</h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            От новичка до профессионального продюсера - мы поможем на каждом этапе
          </p>
          <hr className='text-red-500 my-4 mx-auto border max-w-200'/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-neutral-800 rounded-xl p-6 text-center border border-neutral-700 hover:border-red-500 transition-all duration-300">
            <div className="text-3xl mb-4">🎵</div>
            <h3 className="text-white font-semibold text-xl mb-3">Создавай</h3>
            <p className="text-gray-300">Вдохновляйся работами артистов и битмейкеров и твори</p>
          </div>

          <div className="bg-neutral-800 rounded-xl p-6 text-center border border-neutral-700 hover:border-red-500 transition-all duration-300">
            <div className="text-3xl mb-4">📈</div>
            <h3 className="text-white font-semibold text-xl mb-3">Продвигай</h3>
            <p className="text-gray-300">Получи видимость среди тысяч слушателей и артистов СНГ</p>
          </div>

          <div className="bg-neutral-800 rounded-xl p-6 text-center border border-neutral-700 hover:border-red-500 transition-all duration-300">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-white font-semibold text-xl mb-3">Зарабатывай</h3>
            <p className="text-gray-300">Продавай свои работы и получай пассивный доход</p>
          </div>

          <div className="bg-neutral-800 rounded-xl p-6 text-center border border-neutral-700 hover:border-red-500 transition-all duration-300">
            <div className="text-3xl mb-4">👥</div>
            <h3 className="text-white font-semibold text-xl mb-3">Общайся</h3>
            <p className="text-gray-300">Находи единомышленников и коллаборируй с другими битмейкерами</p>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">500+</div>
              <div className="text-gray-300">Активных битмейкеров</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">2K+</div>
              <div className="text-gray-300">Битов в каталоге</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">10K+</div>
              <div className="text-gray-300">Скачиваний</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">50+</div>
              <div className="text-gray-300">Успешных коллабораций</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Steps;