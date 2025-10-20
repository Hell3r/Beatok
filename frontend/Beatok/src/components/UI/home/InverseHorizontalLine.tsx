import React from 'react';

const InverseHorizontalLine: React.FC = () => {
    return (
        <div className="w-full h-8 relative overflow-visible bg-neutral-925">
            <div 
                className="absolute bottom-0 left-0 w-full h-1 bg-red-500"
                style={{
                    background: 'linear-gradient(90deg, #ef0000 0%, #ef0000 20%, #FF6E6E 50%, #ef0000 80%, #ef0000 100%)',
                    backgroundSize: '200% 100%',
                    backgroundPosition: '-100% 0%',
                    boxShadow: '0 5px 15px rgba(239, 0, 0, 0.8), 0 10px 30px rgba(239, 0, 0, 0.6)',
                    animation: 'loadingMove 2s ease-in-out infinite'
                }}
            />
        </div>
    );
};

export default InverseHorizontalLine;