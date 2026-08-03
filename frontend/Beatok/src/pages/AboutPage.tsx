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
                            Активное сообщество битмейкеров для обмена опытом, продвижения и продаж
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


        </div>
    );
};

export default AboutPage;
