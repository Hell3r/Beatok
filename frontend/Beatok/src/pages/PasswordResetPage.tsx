import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiUrl } from '../services/api';

const PasswordResetPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      navigate('/');
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(apiUrl('/v1/users/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          new_password: formData.newPassword,
          confirm_password: formData.confirmPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка при сбросе пароля');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при сбросе пароля');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 p-4">
        <div className="modal-shell w-full max-w-md p-8 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Пароль успешно изменен!</h2>
          <p className="text-neutral-300">Вы будете перенаправлены на главную страницу через несколько секунд...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 p-4">
      <div className="modal-shell w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Сброс пароля</h1>
          <p className="text-neutral-400 mt-2">Введите новый пароль</p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/35 bg-red-500/14 p-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Новый пароль
            </label>
            <input
              type="password"
              placeholder="Не менее 6 символов"
              value={formData.newPassword}
              onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
              className="w-full p-3 text-white transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Подтвердите пароль
            </label>
            <input
              type="password"
              placeholder="Повторите пароль"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className="w-full p-3 text-white transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="action-button-primary action-button-block"
          >
            {loading ? 'Сброс пароля...' : 'Сбросить пароль'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-red-400 hover:text-red-300 font-medium transition-colors duration-200"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;
