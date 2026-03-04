import React, { useEffect, useState } from 'react';
import HorizontalLine from './HorizontalLine';
import InverseHorizontalLine from './InverseHorizontalLine';
import { useModal } from '../../../hooks/useModal';
import { animated, useSpring, useTransition } from 'react-spring';

const Steps: React.FC = () => {
  const { openModal, closeModal } = useModal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');

  useEffect(() => {
    if (isModalOpen) {
      openModal();
    } else {
      closeModal();
    }
  }, [isModalOpen, openModal, closeModal]);

  const modalTransition = useTransition(isModalOpen, {
    from: { opacity: 0, transform: 'scale(0.8) translateY(-20px)' },
    enter: { opacity: 1, transform: 'scale(1) translateY(0px)' },
    leave: { opacity: 0, transform: 'scale(0.8) translateY(-20px)' },
    config: { tension: 300, friction: 30 }
  });

  const overlayTransition = useTransition(isModalOpen, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: { duration: 200 }
  });

  const modalHeightSpring = useSpring({
    height: '400px',
    config: { tension: 300, friction: 30 }
  });

  return (
    <>
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
          <h3 className="text-white text-2xl font-bold mb-6">Почему выбирают БИТОК?</h3>
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
              <strong>БИТОК</strong> – инновационная платформа, где свобода творчества сочетается с доступностью. Мы верим в поддержку начинающих продюсеров и развитие музыкальной индустрии СНГ. Присоединяйся и создавай музыку без границ!
            </p>
          </div>
        </div>
      </div>

      <HorizontalLine />

      <div className="text-center my-8">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-medium transition-all duration-300 cursor-pointer"
        >
          ПОДДЕРЖАТЬ ПРОЕКТ
        </button>
      </div>

      <div className="bg-neutral-900 py-8 mt-16">
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

      {overlayTransition((style, item) =>
        item && (
          <animated.div
            style={style}
            className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"
            onClick={() => setIsModalOpen(false)}
          />
        )
      )}

      {modalTransition((style, item) =>
        item && (
          <animated.div
            style={style}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <animated.div
              style={modalHeightSpring}
              className="bg-neutral-900 rounded-lg w-full max-w-md border border-neutral-800 shadow-2xl"
            >
              <div className="p-6 border-b border-neutral-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Поддержать проект
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-neutral-400 cursor-pointer hover:text-white transition-colors"
                    aria-label="Закрыть"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-300 text-center mb-4">Поддержите наш проект, мы продолжаем развиваться и создавать новые возможности для битмейкеров СНГ.</p>
                <div className="relative mb-4">
                  <input
                    type="number"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    placeholder="Введите сумму"
                    className="w-full bg-neutral-800 border border-neutral-600 rounded text-white focus:outline-none focus:border-red-500 transition-colors p-3"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">₽</span>
                </div>

                
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      alert(`Спасибо за поддержку! Сумма: ${donationAmount} ₽`);
                      setIsModalOpen(false);
                      setDonationAmount('');
                    }}
                    className="flex-1 cursor-pointer bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors duration-200"
                  >
                    Поддержать
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 cursor-pointer bg-neutral-600 hover:bg-neutral-700 text-white px-4 py-2 rounded font-medium transition-colors duration-200"
                  >
                    Отмена
                  </button>
                  
                </div>
              </div>
            </animated.div>
          </animated.div>
        )
      )}
    </>
  );
};

export default Steps;