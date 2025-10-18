import React from 'react';

const EmailConfirmed: React.FC = () => {
    const handleLoginRedirect = () => {
        window.location.href = '/login';
    };

    return (
        <div className="w-full flex items-center justify-center overflow-y-hidden">
            <div className="container mt-40 mx-auto px-4 text-center select-none">
                <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <svg 
                        className="w-10 h-10 text-white" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={3} 
                            d="M5 13l4 4L19 7" 
                        />
                    </svg>
                </div>

                <h1 className="text-white font-bold text-3xl mb-4">
                    Email подтвержден
                </h1>

                <p className="text-gray-200 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                    Ваш Email адрес подтвержден. Теперь вы можете войти в свой аккаунт 
                    и полноценно пользоваться сервисом.
                </p>

                <button 
                    onClick={handleLoginRedirect}
                    className="bg-red-600 hover:bg-red-700 cursor-pointer text-white px-6 py-3 rounded-md font-medium transition-colors duration-200 focus:outline-none text-base"
                >
                    Перейти к входу
                </button>
            </div>
        </div>
    );
};

export default EmailConfirmed;