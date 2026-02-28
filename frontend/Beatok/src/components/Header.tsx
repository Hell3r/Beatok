import React, { useState, useEffect } from 'react';
import AuthModal from './AuthModal';
import AddBeatModal from './AddBeatModal';
import AvatarDropdown from './AvatarDropdown';
import SubscriptionModal from './SubscriptionModal';
import type { User } from '../types/auth';
import { getAvatarUrl } from '../utils/getAvatarURL';
import { FaHome, FaMusic, FaUser, FaQuestionCircle, FaUsers } from 'react-icons/fa';
import { useNotificationContext } from './NotificationProvider';

interface HeaderProps {
  isAuthenticated?: boolean;
}

interface NavItem {
  href: string;
  label: string;
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Header: React.FC<HeaderProps> = ({ isAuthenticated = false }) => {
  const { showSuccess } = useNotificationContext();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [addBeatModalOpen, setAddBeatModalOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [avatarKey, setAvatarKey] = useState(0);


  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userInfo = localStorage.getItem('user_info');

    if (token && userInfo) {
      try {
        const parsedUserInfo = JSON.parse(userInfo);
        if (!parsedUserInfo.prom_status) {
          parsedUserInfo.prom_status = 'standard';
        }
        setCurrentUser(parsedUserInfo);
      } catch (error) {
        console.error('Error parsing user info:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
      }
    }

    const handleUserUpdate = () => {
      const userInfo = localStorage.getItem('user_info');
      if (userInfo) {
        try {
          const parsedUserInfo = JSON.parse(userInfo);
          if (!parsedUserInfo.prom_status) {
            parsedUserInfo.prom_status = 'standard';
          }
          setCurrentUser(parsedUserInfo);
          setAvatarKey(prev => prev + 1);
        } catch (error) {
          console.error('Error parsing updated user info:', error);
        }
      }
    };

    const handleAuthRequired = () => {
      setAuthModalOpen(true);
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    window.addEventListener('authRequired', handleAuthRequired);
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
      window.removeEventListener('authRequired', handleAuthRequired);
    };
  }, []);

  const navItems: NavItem[] = [
    { href: '/', label: 'ГЛАВНАЯ' },
    { href: '/beats', label: 'БИТЫ' },
    { href: '/beats?free=true', label: 'БЕСПЛАТНЫЕ' },
    { href: '/beatmakers', label: 'БИТМЕЙКЕРЫ' },
  //{ href: '/about', label: 'О НАС' },
    { href: '/support', label: 'FAQ'},
    { href: 'mailto:beatok_service@mail.ru', label: 'BEATOK_SERVICE@MAIL.RU'}]
    


  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.location.href = '/';
  };

  const handleCopyEmail = async () => {
    const email = 'beatok_service@mail.ru';
    try {
      await navigator.clipboard.writeText(email);
      showSuccess('Почта скопирована в буфер обмена!');
    } catch (err) {
      console.error('Failed to copy email: ', err);
    }
  };

  const getCurrentPath = () => {
    return window.location.pathname;
  };





  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:block bg-neutral-950 border-b select-none border-neutral-700 sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
        <nav className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center space-x-10">
            <a
              href="/"
              onClick={handleLogoClick}
              className="text-2xl font-bold hover:scale-105 transition-all duration-200 focus:outline-none"
              aria-label="BEATOK - переход на главную"
            >
              <span className="text-white">BEAT</span>
              <span className="text-red-600">OK</span>
            </a>

            <div className="flex space-x-6">
              {navItems.map((item) => {
                const isActive = item.href === '/' ? getCurrentPath() === '/' :
                  item.href === '/beats' ? getCurrentPath() === '/beats' && !window.location.search.includes('free=true') :
                  item.href === '/beats?free=true' ? window.location.search.includes('free=true') :
                  getCurrentPath() === item.href;
                if (item.href.startsWith('mailto:')) {
                  return (
                    <button
                      key={item.href}
                      onClick={handleCopyEmail}
                      className={`${isActive ? 'text-white' : 'text-gray-300'} hover:text-white transition-colors duration-200 font-medium focus:outline-none cursor-pointer`}
                      title="Скопировать почту"
                    >
                      {item.label}
                    </button>
                  );
                }
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`${isActive ? 'text-white' : 'text-gray-300'} hover:text-white transition-colors duration-200 font-medium focus:outline-none`}
                  >
                    {item.label}
                  </a>
                );
              })}
              {currentUser && currentUser.role === 'admin' && (
                <a
                  href="/admin"
                  className={`${getCurrentPath() === '/admin' ? 'text-white' : 'text-gray-300'} hover:text-white transition-colors duration-200 font-medium focus:outline-none`}
                >
                  АДМИН ПАНЕЛЬ
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {currentUser ? (
              <span className="text-neutral-300 text-sm">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setAddBeatModalOpen(true)}
                    className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-700 cursor-pointer text-white px-3 py-2 rounded-full font-medium transition-colors duration-200 focus:outline-none"
                    aria-label="Добавить бит"
                  >
                    Добавить бит
                  </button>
                  <div className='bg-red-500 hover:bg-red-700 transition-colors font-bold px-3 py-2 rounded-full cursor-pointer' onClick={() => window.location.href = '/profile?tab=balance'}>
                        {currentUser.balance?.toFixed(2)} ₽
                    </div>
                  <div className="relative flex items-center">
                    <div className="flex items-center border border-neutral-600 rounded-full px-3 py-1 cursor-pointer hover:bg-neutral-800 transition-colors" onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}>
                      <div className={`relative ${currentUser.prom_status === 'subscription' ? 'p-0.5 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full' : ''}`}>
                        <img
                          src={`${getAvatarUrl(currentUser.id, currentUser.avatar_path)}?t=${avatarKey}`}
                          alt="Аватар"
                          className={`w-8 h-8 rounded-full object-cover ${currentUser.prom_status === 'subscription' ? 'border-2 border-none' : ''}`}
                          onError={(e) => {
                            e.currentTarget.src = 'http://localhost:8000/static/default_avatar.png'
                          }}
                        />
                      </div>
                      <span className="text-white ml-2 font-medium text-sm">{currentUser.username}</span>
                    </div>
                    <AvatarDropdown
                      isOpen={avatarDropdownOpen}
                      onClose={() => setAvatarDropdownOpen(false)}
                    />
                  </div>
                </div>
              </span>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="bg-red-600 hover:bg-red-700 cursor-pointer text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none"
                aria-label="Войти в аккаунт"
              >
                Войти
              </button>
            )}

          </div>
        </nav>
        {currentUser?.prom_status !== 'subscription' && (
          <div className="gold-shimmer py-1 select-none">
            <div className="container mx-auto px-4 flex justify-center items-center">
              <p className="text-black font-medium text-sm mr-4">
                Загружай до 15 битов в день, пополняй баланс без комиссии и отключи рекламу с подпиской всего за 300 ₽ /мес!
              </p>
              <button
                onClick={() => setSubscriptionModalOpen(true)}
                className="bg-black hover:bg-gray-900 text-white px-3 py-1 rounded-md font-medium transition-colors duration-200 focus:outline-none text-sm cursor-pointer"
              >
                Оформить подписку
              </button>
            </div>
          </div>
        )}
      </header>

      {/* mobile tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral-950 border-t border-neutral-700 z-50">
        <div className="flex justify-around items-center py-2">
          <button
            onClick={() => window.location.href = '/'}
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors hover:bg-neutral-800 ${getCurrentPath() === '/' ? 'bg-red-600' : ''}`}
          >
            <FaHome className={`w-5 h-5 ${getCurrentPath() === '/' ? 'text-white' : 'text-gray-300'}`} />
            <span className={`text-xs ${getCurrentPath() === '/' ? 'text-white' : 'text-gray-300'}`}></span>
          </button>
          <button
            onClick={() => window.location.href = '/beats'}
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors hover:bg-neutral-800 ${getCurrentPath() === '/beats' ? 'bg-red-600' : ''}`}
          >
            <FaMusic className={`w-5 h-5 ${getCurrentPath() === '/beats' ? 'text-white' : 'text-gray-300'}`} />
            <span className={`text-xs ${getCurrentPath() === '/beats' ? 'text-white' : 'text-gray-300'}`}></span>
          </button>
          <button
            onClick={() => window.location.href = '/beatmakers'}
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors hover:bg-neutral-800 ${getCurrentPath() === '/beatmakers' ? 'bg-red-600' : ''}`}
          >
            <FaUsers className={`w-5 h-5 ${getCurrentPath() === '/beatmakers' ? 'text-white' : 'text-gray-300'}`} />
            <span className={`text-xs ${getCurrentPath() === '/beatmakers' ? 'text-white' : 'text-gray-300'}`}></span>
          </button>
          <button
            onClick={() => window.location.href = currentUser ? '/profile' : '#'}
            onClickCapture={currentUser ? undefined : () => setAuthModalOpen(true)}
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors hover:bg-neutral-800 ${getCurrentPath() === '/profile' ? 'bg-red-600' : ''}`}
          >
            <FaUser className={`w-5 h-5 ${getCurrentPath() === '/profile' ? 'text-white' : 'text-gray-300'}`} />
            <span className={`text-xs ${getCurrentPath() === '/profile' ? 'text-white' : 'text-gray-300'}`}></span>
          </button>
          <button
            onClick={() => window.location.href = '/support'}
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors hover:bg-neutral-800 ${getCurrentPath() === '/support' ? 'bg-red-600' : ''}`}
          >
            <FaQuestionCircle className={`w-5 h-5 ${getCurrentPath() === '/support' ? 'text-white' : 'text-gray-300'}`} />
            <span className={`text-xs ${getCurrentPath() === '/support' ? 'text-white' : 'text-gray-300'}`}></span>
          </button>
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <AddBeatModal
        isOpen={addBeatModalOpen}
        onClose={() => setAddBeatModalOpen(false)}
      />

      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
      />
    </>
  );
};

export default Header;