import React from 'react';
import HorizontalLine from './HorizontalLine';
import InverseHorizontalLine from './InverseHorizontalLine';

const Steps: React.FC = () => {
  return (
    <div>
      <div className="container mx-auto px-4 pt-16">
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

      <InverseHorizontalLine />

      <div className="bg-neutral-900 py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-white text-2xl font-bold mb-6">Почему выбирают BEATOK?</h3>
          <div className="max-w-4xl mx-auto text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neutral-800 rounded-lg p-4">
                <h4 className="text-red-500 font-semibold mb-2">🎵 Для битмейкеров</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Продавай биты без условий – нет требований к количеству подписчиков на YouTube</li>
                  <li>• Низкий порог входа: просто зарегистрируйся и загружай работы</li>
                  <li>• Продвигай среди тысяч артистов и слушателей СНГ</li>
                  <li>• Свобода творчества в любом жанре: хип-хоп, рэп, электроника, поп</li>
                  <li>• Получай пассивный доход от скачиваний</li>
                  <li>• Интеграция с соцсетями и партнерства с артистами для продвижения</li>
                </ul>
              </div>
              <div className="bg-neutral-800 rounded-lg p-4">
                <h4 className="text-red-500 font-semibold mb-2">🎧 Для покупателей</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Удобный каталог: ищи биты по жанру, темпу, настроению</li>
                  <li>• Качественные инструменталы без комиссий и скрытых платежей</li>
                  <li>• Используй в коммерческих проектах и коллаборациях</li>
                  <li>• Прозрачность и справедливость в каждом взаимодействии</li>
                  <li>• Все биты проверены на оригинальность и соответствие стандартам</li>
                  <li>• Быстрые скачивания и поддержка музыкантов СНГ</li>
                </ul>
              </div>
            </div>
            <p className="text-gray-300 text-center mt-6 text-lg">
              <strong>BEATOK</strong> – инновационная платформа, где свобода творчества сочетается с доступностью. Мы верим в поддержку начинающих продюсеров и развитие музыкальной индустрии СНГ. Присоединяйся и создавай музыку без границ!
            </p>
          </div>
        </div>
      </div>

      <HorizontalLine />

      <div className="bg-neutral-900 py-16 mt-16">
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