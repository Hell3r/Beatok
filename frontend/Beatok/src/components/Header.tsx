import React, { useState, useEffect } from 'react';
import AuthModal from './AuthModal';
import type { User } from '../types/auth';
import { getAvatarUrl } from '../utils/getAvatarURL';

interface HeaderProps {
  isAuthenticated?: boolean;
}

interface NavItem {
  href: string;
  label: string;
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Header: React.FC<HeaderProps> = ({ isAuthenticated = false }) => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);


  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userInfo = localStorage.getItem('user_info');

    if (token && userInfo) {
      try {
        setCurrentUser(JSON.parse(userInfo));
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
          setCurrentUser(JSON.parse(userInfo));
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
    { href: '/chart', label: 'ЧАРТ' },
    { href: '/freebeats', label: 'БЕСПЛАТНЫЕ' },
    { href: '/forum', label: 'ФОРУМ' },
    { href: '/beatmakers', label: 'БИТМЕЙКЕРЫ' },
    { href: '/about', label: 'О НАС' },
    { href: '/support', label: 'ТЕХ. ПОДДЕРЖКА'},]
    


  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.location.href = '/';
  };

  const handleAuthClick = () => {
    if (currentUser) {
      handleLogout();
    } else {
      setAuthModalOpen(true);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        await fetch('http://localhost:8000/api/v1/users/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');
      setCurrentUser(null);
      window.location.reload();
    }

  };

  return (
    <>
      <header className="bg-neutral-950 border-b border-neutral-700 sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-10">
            <a
              href="/"
              onClick={handleLogoClick}
              className="text-2xl font-bold hover:scale-105 transition-transform duration-200 focus:outline-none"
              aria-label="BEATOK - переход на главную"
            >
              <span className="text-white">BEAT</span>
              <span className="text-red-600">OK</span>
            </a>

            <div className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-gray-300 hover:text-white transition-colors duration-200 font-medium focus:outline-none"
                >
                  {item.label}
                </a>
              ))}
              {currentUser && currentUser.role === 'admin' && (
                <a
                  href="/admin"
                  className="text-gray-300 hover:text-white transition-colors duration-200 font-medium focus:outline-none"
                >
                  АДМИН ПАНЕЛЬ
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {currentUser && (
              <span className="text-neutral-300 text-sm">
                <a href="/profile" className="flex items-center space-x-6">
                  <div className='mx-0 bg-red-500 hover:bg-red-700 transition-colors font-bold px-3 py-2 rounded-full'>
                      {currentUser.balance?.toFixed(2)} ₽
                  </div>
                  <img
                    src={getAvatarUrl(currentUser.id, currentUser.avatar_path)}
                    alt="Аватар"
                    className="w-8 h-8 rounded-full object-cover ml-4"
                    onError={(e) => {
                      e.currentTarget.src = 'http://localhost:8000/static/default_avatar.png'
                    }}
                  />
                </a>
              </span>
            )}
            <button
              onClick={handleAuthClick}
              className="bg-red-600 hover:bg-red-700 cursor-pointer text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none"
              aria-label={currentUser ? 'Выйти из аккаунта' : 'Войти в аккаунт'}
            >
              {currentUser ? 'Выйти' : 'Войти'}
            </button>
          </div>
        </nav>
        <div className="md:hidden bg-gray-800 border-t border-gray-700">
          <div className="container mx-auto px-4 py-2 flex flex-col space-y-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium py-2 px-2 focus:outline-nones"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
    </>
  );
};

export default Header;