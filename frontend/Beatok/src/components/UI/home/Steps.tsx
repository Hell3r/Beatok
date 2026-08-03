import React, { useEffect, useState } from 'react';
import { animated, useSpring, useTransition } from 'react-spring';
import { useModal } from '../../../hooks/useModal';
import HorizontalLine from './HorizontalLine';
import InverseHorizontalLine from './InverseHorizontalLine';

const journeyCards = [
  {
    icon: '🎵',
    title: 'Создавай',
    description: 'Вдохновляйся работами артистов и битмейкеров и твори',
  },
  {
    icon: '📈',
    title: 'Продвигай',
    description: 'Получи видимость среди тысяч слушателей и артистов СНГ',
  },
  {
    icon: '💰',
    title: 'Зарабатывай',
    description: 'Продавай свои работы и получай пассивный доход',
  },
  {
    icon: '👥',
    title: 'Общайся',
    description: 'Находи единомышленников, следи за сценой и развивай свой звук',
  },
];

const makerBenefits = [
  'Продавай биты без условий - нет требований к количеству подписчиков на YouTube',
  'Низкий порог входа: просто зарегистрируйся и загружай работы',
  'Продвигай среди тысяч артистов и слушателей СНГ',
  'Свобода творчества в любом жанре: хип-хоп, рэп, электроника, поп',
  'Получай пассивный доход от скачиваний',
  'Интеграция с соцсетями и удобное продвижение своих релизов',
];

const buyerBenefits = [
  'Удобный каталог: ищи биты по жанру, темпу, настроению',
  'Качественные инструменталы без комиссий и скрытых платежей',
  'Используй в коммерческих проектах, клипах и релизах',
  'Прозрачность и справедливость в каждом взаимодействии',
  'Все биты проверены на оригинальность и соответствие стандартам',
  'Быстрые скачивания и поддержка музыкантов СНГ',
];

const stats = [
  { value: '500+', label: 'Активных битмейкеров' },
  { value: '2K+', label: 'Битов в каталоге' },
  { value: '10K+', label: 'Скачиваний' },
  { value: '50+', label: 'Новых релизов' },
];

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
  }, [closeModal, isModalOpen, openModal]);

  const modalTransition = useTransition(isModalOpen, {
    from: { opacity: 0, transform: 'scale(0.8) translateY(-20px)' },
    enter: { opacity: 1, transform: 'scale(1) translateY(0px)' },
    leave: { opacity: 0, transform: 'scale(0.8) translateY(-20px)' },
    config: { tension: 300, friction: 30 },
  });

  const overlayTransition = useTransition(isModalOpen, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: { duration: 200 },
  });

  const modalHeightSpring = useSpring({
    height: '400px',
    config: { tension: 300, friction: 30 },
  });

  return (
    <>
      <div className="container mx-auto px-4 pt-16">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">🚀 Твой путь в мире битмейкинга</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            От новичка до профессионального продюсера - мы поможем на каждом этапе
          </p>
          <hr className="mx-auto my-4 max-w-[800px] border text-red-500" />
        </div>

        <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {journeyCards.map((card) => (
            <div
              key={card.title}
              className="glass-panel-strong rounded-[28px] p-6 text-center shadow-[0_24px_60px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-red-500/35 hover:shadow-[0_28px_70px_rgba(220,38,38,0.14)]"
            >
              <div className="mb-4 text-3xl">{card.icon}</div>
              <h3 className="mb-3 text-xl font-semibold text-white">{card.title}</h3>
              <p className="text-gray-300">{card.description}</p>
            </div>
          ))}
        </div>
      </div>

      <InverseHorizontalLine />

      <div className="py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="section-shell rounded-[34px] px-6 py-10 md:px-10 md:py-12">
            <h3 className="mb-6 text-2xl font-bold text-white">Почему выбирают БИТОК?</h3>
            <div className="mx-auto max-w-4xl text-left">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="glass-panel-strong rounded-[28px] p-5 md:p-6">
                  <h4 className="mb-2 font-semibold text-red-500">🎵 Для битмейкеров</h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    {makerBenefits.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="glass-panel-strong rounded-[28px] p-5 md:p-6">
                  <h4 className="mb-2 font-semibold text-red-500">🎧 Для покупателей</h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    {buyerBenefits.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="mt-6 text-center text-lg text-gray-300">
                <strong>БИТОК</strong> - инновационная платформа, где свобода творчества сочетается с
                доступностью. Мы верим в поддержку начинающих продюсеров и развитие музыкальной
                индустрии СНГ. Присоединяйся и создавай музыку без границ!
              </p>
            </div>
          </div>
        </div>
      </div>

      <HorizontalLine />

      <div className="my-8 text-center">
        <button onClick={() => setIsModalOpen(true)} className="action-button-primary">
          ПОДДЕРЖАТЬ ПРОЕКТ
        </button>
      </div>

      <div className="mt-16 py-8">
        <div className="container mx-auto px-4">
          <div className="glass-panel-strong rounded-[32px] px-6 py-8 md:px-10">
            <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
              {stats.map((item) => (
                <div key={item.label} className="glass-panel rounded-[22px] px-4 py-5">
                  <div className="mb-2 text-3xl font-bold text-red-600">{item.value}</div>
                  <div className="text-gray-300">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {overlayTransition(
        (style, item) =>
          item && (
            <animated.div
              style={style}
              className="modal-backdrop z-40"
              onClick={() => setIsModalOpen(false)}
            />
          ),
      )}

      {modalTransition(
        (style, item) =>
          item && (
            <animated.div style={style} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <animated.div style={modalHeightSpring} className="modal-shell w-full max-w-md">
                <div className="modal-divider border-b p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">Поддержать проект</h2>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="cursor-pointer text-neutral-400 transition-colors hover:text-white"
                      aria-label="Закрыть"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <p className="mb-4 text-center text-gray-300">
                    Поддержите наш проект, мы продолжаем развиваться и создавать новые возможности
                    для битмейкеров СНГ.
                  </p>

                  <div className="relative mb-4">
                    <input
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      placeholder="Введите сумму"
                      className="w-full p-3 text-white transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400">₽</span>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        alert(`Спасибо за поддержку! Сумма: ${donationAmount} ₽`);
                        setIsModalOpen(false);
                        setDonationAmount('');
                      }}
                      className="action-button-primary action-button-compact flex-1"
                    >
                      Поддержать
                    </button>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="action-button-secondary action-button-compact flex-1"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </animated.div>
            </animated.div>
          ),
      )}
    </>
  );
};

export default Steps;
