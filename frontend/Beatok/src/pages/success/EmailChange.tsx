import React, { useState } from 'react';

const EmailChange: React.FC = () => {
    const [oldEmail, setOldEmail] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');


        try {
            const response = await fetch('/api/v1/users/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // auth head
                },
                body: JSON.stringify({
                    email: newEmail,
                    // Include old email if required by API
                }),
            });

            if (response.ok) {
                setMessage('Email успешно изменён!');
            } else {
                const errorData = await response.json();
                setMessage(errorData.detail || 'Ошибка при изменении email');
            }
        } catch (error) {
            setMessage('Ошибка сети. Попробуйте позже.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex items-center justify-center overflow-y-hidden">
            <div className="container mt-40 mx-auto px-4 text-center select-none">
                <h1 className="text-white font-bold text-3xl mb-4">
                    Изменение Email
                </h1>

                <p className="text-gray-200 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                    Введите ваш текущий email и новый email для подтверждения изменения.
                </p>

                <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
                    <div>
                        <label className="block text-sm font-medium select-none text-neutral-300 mb-2">
                            Текущий Email *
                        </label>
                        <input
                            type="email"
                            placeholder="Введите текущий email"
                            value={oldEmail}
                            onChange={(e) => setOldEmail(e.target.value)}
                            className="w-full h-10 p-2 bg-neutral-800 border border-neutral-600 rounded text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium select-none text-neutral-300 mb-2">
                            Новый Email *
                        </label>
                        <input
                            type="email"
                            placeholder="Введите новый email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full h-10 p-2 bg-neutral-800 border border-neutral-600 rounded text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                            required
                        />
                    </div>

                    <div className='text-center'>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full select-none cursor-pointer max-w-100 mx-auto bg-red-600 hover:bg-red-700 text-white p-3 rounded font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Подтверждение...' : 'Подтвердить изменение'}
                        </button>
                    </div>
                </form>

                {message && (
                    <p className="text-gray-200 text-lg mt-4">
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
};

export default EmailChange;
