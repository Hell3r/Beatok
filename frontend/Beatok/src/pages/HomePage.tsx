import React, { useState, useEffect } from 'react';
import PopularBeats from '../components/UI/home/PopularBeats';
import FeaturedBeats from '../components/UI/home/FeaturedBeats';
import TopBeatmakers from '../components/UI/home/TopBeatmakers';
import CallToAction from '../components/UI/home/CallToAction';
import Steps from '../components/UI/home/Steps';
import SecuritySection from '../components/UI/home/SecuritySection';
import HorizontalLine from '../components/UI/home/HorizontalLine';
import InverseHorizontalLine from '../components/UI/home/InverseHorizontalLine';
import Footer from '../components/UI/Footer';

const HomePage: React.FC = () => {
    const [scale, setScale] = useState(1.5);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const newScale = Math.max(1, 1.5 - (scrollY / window.innerHeight) * 0.5);
            setScale(newScale);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen w-full">
            <div className='w-full relative overflow-hidden' style={{ minHeight: '95vh' }}>
                <img
                    src="http://localhost:8000/static/images/homepage-bg.jpg"
                    alt="Homepage Background"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                        transform: `scale(${scale})`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.1s ease-out'
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-black/60"></div>

                <div className="relative z-10 pt-45 pb-16 top-10 select-none">
                    <div className='container mx-auto px-2 text-center'>
                        <h1 className="text-white font-bold text-4xl mb-2">ДОБРО ПОЖАЛОВАТЬ</h1>
                        <div className="mb-4">
                            <h3 className="inline text-white font-bold text-4xl">на </h3>
                            <div className='inline-block glitch-text'>
                                <h3 className="inline text-white font-bold text-5xl">BEAT</h3>
                                <h3 className="inline text-red-600 font-bold text-5xl">OK</h3>
                            </div>
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

            <HorizontalLine />

            <FeaturedBeats />

            <HorizontalLine />

            <div className="bg-neutral-925 select-none w-full">
                <PopularBeats />

                <div className="w-full select-none">
                    <InverseHorizontalLine />
                    <CallToAction />
                    <HorizontalLine />
                </div>
                <TopBeatmakers />
                <HorizontalLine />
                <SecuritySection />
                <HorizontalLine />
                <div className="w-full select-none">
                    <Steps/>
                </div>


            </div>

            <Footer />
        </div>
    );
};

export default HomePage;