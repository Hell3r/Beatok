import React, { useState, useEffect } from 'react';
import { useTransition, animated, useSpring } from '@react-spring/web';
import type { User, AuthResponse } from '../types/auth';
import { useModal } from '../hooks/useModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'register' | 'emailVerification';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { openModal, closeModal } = useModal();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthday: ''
  });

  useEffect(() => {
    if (isOpen) {
      openModal();
    } else {
      closeModal();
    }
  }, [isOpen, openModal, closeModal]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    try {
      const response = await fetch('http://localhost:8000/v1/users/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: verificationEmail })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка при отправке письма');
      }

      setResendCooldown(60);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при отправке письма');
    }
  };

  const modalTransition = useTransition(isOpen, {
    from: { opacity: 0, transform: 'scale(0.8) translateY(-20px)' },
    enter: { opacity: 1, transform: 'scale(1) translateY(0px)' },
    leave: { opacity: 0, transform: 'scale(0.8) translateY(-20px)' },
    config: { tension: 300, friction: 30 }
  });

  const overlayTransition = useTransition(isOpen, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: { duration: 200 }
  });

  const formTransition = useTransition(mode, {
    from: { opacity: 0, transform: 'translateY(20px)' },
    enter: { opacity: 1, transform: 'translateY(0px)' },
    leave: { opacity: 0, transform: 'translateY(-20px)' },
    config: { tension: 300, friction: 30 }
  });

  const modalHeightSpring = useSpring({
    height: mode === 'login' ? (error ? '505px' : '425px') : mode === 'register' ? (error ? '780px' : '700px') : '450px',
    config: { tension: 300, friction: 30 }
  });

  const maskEmail = (email: string) => {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) return email;
    const maskedLocal = localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1];
    return `${maskedLocal}@${domain}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', loginData.email);
      formData.append('password', loginData.password);

      const response = await fetch('http://localhost:8000/v1/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.detail === 'Аккаунт не активирован. Подтвердите ваш email.') {
          setVerificationEmail(loginData.email);
          setMode('emailVerification');
          setLoading(false);
          return;
        }
        throw new Error(errorData.detail || 'Ошибка авторизации');
      }

      const authData: AuthResponse = await response.json();

      localStorage.setItem('access_token', authData.access_token);

      const userData: User = {
        id: authData.user_info?.user_id || 0,
        username: authData.user_info?.username || loginData.email.split('@')[0],
        email: authData.user_info?.email || loginData.email,
        is_active: true,
        birthday: authData.user_info?.birthday || '',
        role: authData.user_info?.role || 'common',
        avatar_path: authData.user_info?.avatar_path || 'static/default_avatar.png',
        balance: authData.user_info?.balance || 0,
        prom_status: authData.user_info?.prom_status || 'standard'
      };

      localStorage.setItem('user_info', JSON.stringify(userData));

      onClose();
      window.dispatchEvent(new Event('userUpdated'));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при авторизации');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setLoading(false);
      return;
    }

    if (registerData.username.length < 3) {
      setError('Имя пользователя должно содержать минимум 3 символа');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/v1/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: registerData.username,
          email: registerData.email,
          password: registerData.password,
          birthday: registerData.birthday
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка регистрации');
      }

      setVerificationEmail(registerData.email);
      setMode('emailVerification');
      setLoading(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при регистрации');
      setLoading(false);
    }
  };

  return (
    <>
      {overlayTransition((style, item) =>
        item && (
          <animated.div
            style={style}
            className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"
            onClick={onClose}
          />
        )
      )}

      {modalTransition((style, item) =>
        item && (
          <animated.div
            style={style}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <animated.div
              style={modalHeightSpring}
              className="bg-neutral-900 rounded-lg w-full max-w-md border border-neutral-800 shadow-2xl"
            >
              <div className="p-6 border-b border-neutral-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {mode === 'login' ? 'Вход' : mode === 'register' ? 'Регистрация' : 'Подтверждение Email'}
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-neutral-400 cursor-pointer hover:text-white transition-colors"
                    aria-label="Закрыть"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-900/80 border border-red-700 rounded text-red-200 text-sm">
                    {error}
                  </div>
                )}

                {formTransition((style, item) => (
                  <animated.div style={style} className="overflow-hidden">
                    {item === 'login' ? (
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            placeholder="your@email.com"
                            value={loginData.email}
                            onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                            className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded text-white focus:outline-none focus:border-red-500 transition-colors"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Пароль
                          </label>
                          <input
                            type="password"
                            placeholder="Введите пароль"
                            value={loginData.password}
                            onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                            className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded text-white focus:outline-none focus:border-red-500 transition-colors"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full cursor-pointer bg-red-600 hover:bg-red-700 text-white p-3 rounded font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Вход...' : 'Войти'}
                        </button>
                      </form>
                    ) : item === 'register' ? (
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Имя пользователя
                          </label>
                          <input
                            type="text"
                            placeholder="Придумайте имя (мин. 3 символа)"
                            value={registerData.username}
                            onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                            className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-red-500 transition-colors"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            placeholder="your@email.com"
                            value={registerData.email}
                            onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                            className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-red-500 transition-colors"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Дата рождения
                          </label>
                          <input
                            type="date"
                            value={registerData.birthday}
                            onChange={(e) => setRegisterData({...registerData, birthday: e.target.value})}
                            className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-red-500 transition-colors"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-2">
                            Пароль
                          </label>
                          <input
                            type="password"
                            placeholder="Не менее 6 символов"
                            value={registerData.password}
                            onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                            className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-red-500 transition-colors"
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
                            value={registerData.confirmPassword}
                            onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                            className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-red-500 transition-colors"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-red-600 cursor-pointer hover:bg-red-700 text-white p-3 rounded font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center select-none">
                          <div className="mb-4">
                            <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-white mb-2">Регистрация успешна!</h3>
                          <p className="text-neutral-300 mb-4">
                            Мы отправили письмо с подтверждением на адрес <strong>{maskEmail(verificationEmail)}</strong>
                          </p>
                          <p className="text-sm text-neutral-400 mb-6">
                            Пожалуйста, проверьте свою почту и перейдите по ссылке в письме для активации аккаунта.
                          </p>
                          <div className="space-y-3">
                            <button
                              onClick={() => {
                                setMode('login');
                                setVerificationEmail('');
                                setError('');
                                setResendCooldown(0);
                              }}
                              className="w-full select-none cursor-pointer bg-red-600 hover:bg-red-700 text-white p-3 rounded font-medium transition-colors duration-200"
                            >
                              Понятно
                            </button>

                            <button
                              onClick={handleResend}
                              disabled={resendCooldown > 0}
                              className="w-full select-none cursor-pointer bg-neutral-700 hover:bg-neutral-600 text-white p-3 rounded font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {resendCooldown > 0 ? `Отправить ещё раз (${resendCooldown} сек)` : 'Отправить ещё раз'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </animated.div>
                ))}

                <div className="mt-6 text-center">
                  <p className="text-neutral-400">
                    {mode === 'login' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === 'login' ? 'register' : 'login');
                        setError('');
                      }}
                      className="text-red-400  cursor-pointer hover:text-red-300 font-medium transition-colors duration-200"
                    >
                      {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
                    </button>
                  </p>
                </div>
              </div>
            </animated.div>
          </animated.div>
        )
      )}
    </>
  );
};

export default AuthModal;