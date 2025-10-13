import React from 'react';
import PopularBeats from '../components/UI/home/PopularBeats';
import TopBeatmakers from '../components/UI/home/TopBeatmakers';
import CallToAction from '../components/UI/home/CallToAction';
import Steps from '../components/UI/home/Steps';

const HomePage: React.FC = () => {
    return (
        <div className="min-h-screen w-full">
            <div
                className='w-full relative'
                style={{
                    backgroundImage: 'url("http://localhost:8000/static/images/homepage-bg.jpg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    minHeight: '60vh'
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-black/60"></div>

                <div className="relative z-10 pt-20 pb-16 top-10 select-none">
                    <div className='container mx-auto px-2 text-center'>
                        <h1 className="text-white font-bold text-4xl glitch-text mb-2">ДОБРО ПОЖАЛОВАТЬ</h1>
                        <div className="mb-4">
                            <h3 className="inline text-white font-bold text-4xl">на </h3>
                            <h3 className="inline text-white font-bold text-5xl">BEAT</h3>
                            <h3 className="inline text-red-600 font-bold text-5xl">OK</h3>
                        </div>
                        <hr className='my-6 w-48 border-t-2 border-red-600 mx-auto' />
                        <h3 className='text-white text-xl mb-4 max-w-3xl mx-auto'>
                            Свежий сервис для продажи, покупки и скачивания бесплатных битов в СНГ!
                        </h3>
                        <p className='text-gray-200 text-lg max-w-3xl mx-auto'>
                            Актуальные цены, качественные биты всех жанров, настроений, тональностей и темпов!
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-neutral-925 select-none">
                <div className="container mx-auto max-w-full py-12 space-y-16">
                    <PopularBeats />
                    <TopBeatmakers />
                </div>

                <div className="w-full select-none">
                    <CallToAction />
                    <Steps/>
                </div>
                
            </div>
        </div>
    );
};

export default HomePage;