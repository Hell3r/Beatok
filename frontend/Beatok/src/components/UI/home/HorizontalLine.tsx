import React from 'react';

const HorizontalLine: React.FC = () => {
    return (
        <div className="w-full h-8 relative overflow-hidden bg-neutral-925">
            <div 
                className="absolute top-0 left-0 w-full h-1 bg-red-500"
                style={{
                    background: 'linear-gradient(90deg, #ef0000 0%, #ef0000 20%, #FF6E6E 50%, #ef0000 80%, #ef0000 100%)',
                    backgroundSize: '200% 100%',
                    backgroundPosition: '-100% 0%',
                    boxShadow: '0 0 15px #ef0000, 0 0 30px #ef0000',
                    animation: 'loadingMove 2s ease-in-out infinite'
                }}
            />
        </div>
    );
};

export default HorizontalLine;