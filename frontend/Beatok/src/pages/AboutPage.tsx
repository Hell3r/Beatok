import React from 'react';
import HorizontalLine from '../components/UI/home/HorizontalLine';
import InverseHorizontalLine from '../components/UI/home/InverseHorizontalLine';

const AboutPage: React.FC = () => {
    return (
        <div className="min-h-screen w-full select-none bg-neutral-925">
            <div className="container mx-auto px-16 py-4">
                <div className="text-left">
                    <div className="mb-4">
                        <div className='inline-block glitch-text mb-8'>
                            <h3 className="inline text-white font-bold text-6xl">BEAT</h3>
                            <h3 className="inline text-red-600 font-bold text-6xl">OK</h3>
                        </div>
                        <div className="max-w-4xl">
                            <p className='text-gray-200 text-xl mb-4'>
                                Beatok - это не просто платформа, это революция в мире битмейкинга СНГ.
                            </p>
                            <p className='text-gray-300 text-lg mb-8'>
                                Мы объединяем таланты, создаем возможности и помогаем каждому битмейкеру
                                найти свой звук в цифровом пространстве.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <HorizontalLine />

            <div className="container px-16 py-16">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white mb-8">🚀 Наша миссия</h2>
                    <p className="text-gray-300 text-lg leading-relaxed">
                        Создать идеальную экосистему для битмейкеров, где творчество встречается с технологиями,
                        а таланты находят свою аудиторию. Мы верим, что каждый битмейкер заслуживает шанса
                        на успех в музыкальной индустрии.
                    </p>
                </div>
            </div>

            <InverseHorizontalLine />

            <div className="container mx-auto px-4 py-16">
                <h2 className="text-3xl font-bold text-white text-center mb-12">Что мы предлагаем</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-neutral-800 rounded-xl p-6 text-center border border-neutral-700 hover:border-red-500 transition-all duration-300 hover:scale-105">
                        <div className="text-4xl mb-4">🎵</div>
                        <h3 className="text-white font-semibold text-xl mb-3">Биты</h3>
                        <p className="text-gray-300">
                            Тысячи уникальных битов всех жанров от профессиональных продюсеров СНГ
                        </p>
                    </div>
                    <div className="bg-neutral-800 rounded-xl p-6 text-center border border-neutral-700 hover:border-red-500 transition-all duration-300 hover:scale-105">
                        <div className="text-4xl mb-4">👥</div>
                        <h3 className="text-white font-semibold text-xl mb-3">Сообщество</h3>
                        <p className="text-gray-300">
                            Активное сообщество битмейкеров для обмена опытом и создания коллабораций
                        </p>
                    </div>
                    <div className="bg-neutral-800 rounded-xl p-6 text-center border border-neutral-700 hover:border-red-500 transition-all duration-300 hover:scale-105">
                        <div className="text-4xl mb-4">💰</div>
                        <h3 className="text-white font-semibold text-xl mb-3">Монетизация</h3>
                        <p className="text-gray-300">
                            Гибкие инструменты для продажи битов и получения пассивного дохода
                        </p>
                    </div>
                </div>
            </div>

            <HorizontalLine />

            <div className="container mx-auto px-16 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-6">Наша история</h2>
                        <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                            Beatok родился из страсти к музыке и желания изменить индустрию битмейкинга.
                            Мы увидели, как много талантливых продюсеров остаются незамеченными, и решили
                            создать платформу, где каждый может сиять.
                        </p>
                        <p className="text-gray-300 text-lg leading-relaxed">
                            Сегодня Beatok - это место, где рождаются хиты, строятся карьеры и создаются
                            легенды. Мы продолжаем развиваться, чтобы дать каждому битмейкеру инструменты
                            для достижения мечты.
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="relative">
                            <div className="w-full max-w-md mx-auto h-80 bg-gradient-to-br from-red-600/20 to-neutral-800 rounded-2xl flex items-center justify-center border border-neutral-700">
                                <span className="text-7xl">🎧</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <InverseHorizontalLine />

            <div className="container mx-auto px-4 py-16">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-6">Связаться с нами</h2>
                <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                  Готов присоединиться к революции? У тебя есть идеи или вопросы?
                  Мы всегда открыты для общения с нашим сообществом!
                </p>
                <div className="flex justify-center space-x-20">
                  {/* email */}
                  <a
                    href="mailto:beatok_service@mail.ru"
                    className="group flex flex-col items-center transition-all duration-300 hover:scale-110"
                    title="Написать на почту"
                  >
                    <div className="w-16 h-16 bg-transparent rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-red-500/10">
                      <svg
                        className="w-10 h-10 text-white/80 transition-all duration-300 group-hover:text-red-500 group-hover:scale-110"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                    </div>
                    <span className="mt-3 text-white/70 text-sm transition-all duration-300 group-hover:text-red-500">
                      Email
                    </span>
                  </a>

                  {/* tg */}
                  <a
                    href="https://t.me/beatok_service"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center transition-all duration-300 hover:scale-110"
                    title="Написать в Telegram"
                  >
                    <div className="w-16 h-16 bg-transparent rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-red-500/10">
                      <svg
                        className="w-10 h-10 text-white/80 transition-all duration-300 group-hover:text-red-500 group-hover:scale-110"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.14.14-.26.26-.534.26l.213-3.05 5.56-5.022c.24-.213-.054-.334-.373-.12l-6.87 4.326-2.96-.924c-.64-.203-.658-.64.136-.954l11.57-4.46c.538-.196 1.006.128.832.941z"/>
                      </svg>
                    </div>
                    <span className="mt-3 text-white/70 text-sm transition-all duration-300 group-hover:text-red-500">
                      Telegram
                    </span>
                  </a>
                </div>
              </div>
            </div>
        </div>
    );
};

export default AboutPage;
