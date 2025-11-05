import React from 'react';

const FeaturedBeats: React.FC = () => {
  const featuredBeats = [
    {
      id: 1,
      name: 'Epic Trap Beat',
      author: 'BeatMaster',
      avatar: 'http://localhost:8000/static/default_avatar.png',
      price: 1500,
      isFree: false,
    },
    {
      id: 2,
      name: 'Chill Lo-Fi Vibes',
      author: 'LoFiProducer',
      avatar: 'http://localhost:8000/static/default_avatar.png',
      price: 0,
      isFree: true,
    },
    {
      id: 3,
      name: 'Hardstyle Energy',
      author: 'HardBeats',
      avatar: 'http://localhost:8000/static/default_avatar.png',
      price: 1500,
      isFree: false,
    },
  ];

  return (
    <div className="bg-neutral-925 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 select-none">
          <h2 className="text-3xl font-bold text-white mb-2">В центре внимания</h2>
          <p className="text-gray-300">Особые биты от наших лучших продюсеров</p>
          <hr className="text-red-500 my-4 mx-auto border max-w-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredBeats.map((beat) => (
            <div
              key={beat.id}
              className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl p-6 shadow-lg hover:shadow-2xl hover:bg-gradient-to-br hover:from-neutral-700 hover:to-neutral-800 transition-colors duration-700 border border-neutral-700 group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full border-4 border-yellow-500 overflow-hidden select-none">
                    <img
                      src={beat.avatar}
                      alt={`Аватар ${beat.author}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'http://localhost:8000/static/default_avatar.png';
                      }}
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-black text-xs font-bold select-none">★</span>
                  </div>
                </div>

                <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-red-400 transition-colors">
                  {beat.name}
                </h3>
                <p className="text-neutral-400 text-sm mb-4">by {beat.author}</p>

                <button
                  className={`px-6 py-3 rounded-full font-bold text-white transition-all duration-300 cursor-pointer select-none ${
                    beat.isFree
                      ? 'bg-neutral-700 hover:bg-neutral-600'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {beat.isFree ? 'Скачать' : `от ${beat.price} ₽`}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedBeats;
