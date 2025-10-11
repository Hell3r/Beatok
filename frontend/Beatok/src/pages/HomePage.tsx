import React, { } from 'react';

const HomePage: React.FC = () => {


    return (
        <div className='justify-center items-center'>

            
            <div className='mx-10 my-5 justify-center items-center select-none'>
                <div className='mx-auto block justify-center items-center '>
                    <h1 className="text-white font-bold text-4xl typing">ДОБРО ПОЖАЛОВАТЬ</h1>
                    <h3 className="inline text-white font-bold text-4xl">на </h3>
                    <h3 className="inline text-white font-bold text-5xl">BEAT</h3>
                    <h3 className="inline text-red-600 font-bold text-5xl">OK</h3>
                </div>
                <hr className='my-3 w-165 border-t-2 border-red-600' />
                <h3 className='text-white'>
                    Свежий сервис для продажи, покупки и скачивания бесплатных битов в СНГ!
                </h3> 
                <p className='text-white'>
                    Актуальные цены, качественные биты всех жанров, настроений, тональностей и темпов!
                </p>
            </div>


            <div>

            </div>
        </div>
    );
};

export default HomePage;