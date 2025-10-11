import React, { } from 'react';

const Error404: React.FC = () => {


    return (
        <div className="mx-auto flex items-center justify-center my-50">
            <div className="container mx-auto flex items-center justify-center">
                <h3 className="text-red-600 Arial font-bold text-8xl select-none inline">
                    404 
                </h3>
                <p className="text-white Arial font-bold text-5xl select-none inline mx-5">
                    Not found
                </p>
            </div>
        </div>

    );
};

export default Error404;