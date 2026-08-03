import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaClipboardList,
  FaHome,
  FaMusic,
  FaQuestionCircle,
  FaUser,
  FaUsers,
} from 'react-icons/fa';
import AuthModal from './AuthModal';
import AddBeatModal from './AddBeatModal';
import AvatarDropdown from './AvatarDropdown';
import SubscriptionModal from './SubscriptionModal';
import { useNotificationContext } from './NotificationProvider';
import type { User } from '../types/auth';
import { getAvatarUrl } from '../utils/getAvatarURL';

interface HeaderProps {
  isAuthenticated?: boolean;
}

interface NavItem {
  href: string;
  label: string;
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated = false }) => {
  const navigate = useNavigate();
  const { showSuccess } = useNotificationContext();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [addBeatModalOpen, setAddBeatModalOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [avatarKey, setAvatarKey] = useState(0);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);
  const [headerGlow, setHeaderGlow] = useState({ x: 50, y: 50, visible: false });
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

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
      const updatedUserInfo = localStorage.getItem('user_info');
      if (!updatedUserInfo) {
        setCurrentUser(null);
        return;
      }

      try {
        const parsedUserInfo = JSON.parse(updatedUserInfo);
        if (!parsedUserInfo.prom_status) {
          parsedUserInfo.prom_status = 'standard';
        }
        setCurrentUser(parsedUserInfo);
        setAvatarKey((prev) => prev + 1);
      } catch (error) {
        console.error('Error parsing updated user info:', error);
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

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let revealTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = Math.abs(currentScrollY - lastScrollY);

      if (delta < 3) return;

      if (currentScrollY <= 8) {
        setIsHeaderVisible(true);
      } else {
        setIsHeaderVisible(false);
      }

      if (revealTimeout) {
        clearTimeout(revealTimeout);
      }

      revealTimeout = setTimeout(() => {
        setIsHeaderVisible(true);
      }, 140);

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (revealTimeout) {
        clearTimeout(revealTimeout);
      }
    };
  }, []);

  const navItems: NavItem[] = [
    { href: '/', label: 'Главная' },
    { href: '/beats', label: 'Биты' },
    { href: '/beats?free=true', label: 'Бесплатные' },
    { href: '/beatmakers', label: 'Битмейкеры' },
    { href: '/support', label: 'FAQ' },
    { href: 'mailto:beatok_service@mail.ru', label: 'Почта' },
  ];

  const authNavItems: NavItem[] = [];

  const handleCopyEmail = async () => {
    const email = 'beatok_service@mail.ru';
    try {
      await navigator.clipboard.writeText(email);
      showSuccess('Почта скопирована в буфер обмена!');
    } catch (err) {
      console.error('Failed to copy email: ', err);
    }
  };

  const getCurrentPath = () => window.location.pathname;
  const isFreeBeatsRoute = () =>
    getCurrentPath() === '/beats' && window.location.search.includes('free=true');

  const isBeatsRoute = () =>
    getCurrentPath() === '/beats' && !window.location.search.includes('free=true');

  const handleHeaderMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHeaderGlow({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
      visible: true,
    });
  };

  const desktopProfileAction = currentUser ? (
    <div className="relative z-[90] flex items-center gap-3">
      <button
        onClick={() => setAddBeatModalOpen(true)}
        className="action-button-secondary action-button-compact text-sm"
        aria-label="Добавить бит"
      >
        Добавить бит
      </button>
      <button
        onClick={() => navigate('/profile?tab=balance')}
        className="header-balance-pill action-button-compact text-sm"
      >
        {currentUser.balance?.toFixed(2)} ₽
      </button>
      <div className="relative">
        <button
          ref={avatarButtonRef}
          type="button"
          aria-expanded={avatarDropdownOpen}
          aria-haspopup="menu"
          onClick={() => setAvatarDropdownOpen((prev) => !prev)}
          className="nav-shell flex items-center gap-3 rounded-full px-2 py-2 pr-4 transition hover:border-white/15 hover:bg-white/8"
        >
          <div
            className={`relative ${
              currentUser.prom_status === 'subscription'
                ? 'rounded-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 p-[2px]'
                : ''
            }`}
          >
            <img
              src={`${getAvatarUrl(currentUser.id, currentUser.avatar_path)}?t=${avatarKey}`}
              alt="Аватар"
              className="h-10 w-10 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://beatokservice.ru/api/static/default_avatar.png';
              }}
            />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-white">{currentUser.username}</div>
            <div className="text-xs text-neutral-400">
              {currentUser.prom_status === 'subscription'
                ? 'Подписка активна'
                : 'Личный кабинет'}
            </div>
          </div>
        </button>
        <AvatarDropdown
          anchorRef={avatarButtonRef}
          isOpen={avatarDropdownOpen}
          onClose={() => setAvatarDropdownOpen(false)}
        />
      </div>
    </div>
  ) : (
    <button
      onClick={() => setAuthModalOpen(true)}
      className="action-button-primary action-button-compact text-sm"
      aria-label="Войти в аккаунт"
    >
      Войти
    </button>
  );

  return (
    <>
      <header
        className={`sticky top-0 z-50 overflow-visible px-2 pt-3 transition-transform duration-300 md:px-3 md:pt-4 ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-[calc(100%+20px)]'
        }`}
      >
        <div
          className="mx-auto hidden w-full max-w-[1480px] overflow-visible md:block"
          onMouseMove={handleHeaderMove}
          onMouseLeave={() => setHeaderGlow((prev) => ({ ...prev, visible: false }))}
        >
          <div className="nav-shell overflow-visible rounded-[28px] px-3 py-3 xl:px-4 2xl:px-5">
            <div
              className="pointer-events-none absolute inset-0 transition-opacity duration-500"
              style={{
                opacity: headerGlow.visible ? 1 : 0,
                background: `radial-gradient(circle 180px at ${headerGlow.x}% ${headerGlow.y}%, rgba(255,255,255,0.12), rgba(255,255,255,0.045) 28%, rgba(255,255,255,0.018) 46%, transparent 68%)`,
                filter: 'blur(16px)',
              }}
            />
            <nav className="flex items-center justify-between gap-3 xl:gap-4 2xl:gap-5">
              <div className="flex min-w-0 items-center gap-2 xl:gap-4 2xl:gap-6">
                <Link
                  to="/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/');
                  }}
                  className="shrink-0 rounded-full border border-white/8 bg-white/[0.03] px-3 py-3 transition hover:-translate-y-0.5 hover:border-white/15 2xl:px-4"
                  aria-label="БИТОК - переход на главную"
                >
                  <span className="text-2xl font-black tracking-[-0.08em] text-white">БИТ</span>
                  <span className="text-2xl font-black tracking-[-0.08em] text-red-600">ОК</span>
                </Link>

                <div className="hidden min-w-0 flex-1 items-center gap-1.5 xl:flex">
                  {navItems.map((item) => {
                    const isActive =
                      item.href === '/'
                        ? getCurrentPath() === '/'
                        : item.href === '/beats'
                          ? isBeatsRoute()
                          : item.href === '/beats?free=true'
                            ? isFreeBeatsRoute()
                            : getCurrentPath() === item.href;

                    if (item.href.startsWith('mailto:')) {
                      return (
                        <button
                          key={item.href}
                          onClick={handleCopyEmail}
                          className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-2 text-xs font-medium transition xl:px-3 2xl:px-4 2xl:text-sm ${
                            isActive
                              ? 'bg-white/10 text-white'
                              : 'text-neutral-300 hover:bg-white/6 hover:text-white'
                          }`}
                          title="Скопировать почту"
                        >
                          {item.label}
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-2 text-xs font-medium transition xl:px-3 2xl:px-4 2xl:text-sm ${
                          isActive
                            ? 'bg-white/10 text-white'
                            : 'text-neutral-300 hover:bg-white/6 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}

                  {currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator') && (
                    <Link
                      to="/admin"
                      className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-2 text-xs font-medium transition xl:px-3 2xl:px-4 2xl:text-sm ${
                        getCurrentPath() === '/admin'
                          ? 'bg-white/10 text-white'
                          : 'text-neutral-300 hover:bg-white/6 hover:text-white'
                      }`}
                    >
                      Админ
                    </Link>
                  )}

                  {currentUser &&
                    authNavItems.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        className="shrink-0 whitespace-nowrap rounded-full px-2.5 py-2 text-xs font-medium text-neutral-300 transition hover:bg-white/6 hover:text-white xl:px-3 2xl:px-4 2xl:text-sm"
                      >
                        <span className="inline-flex items-center gap-2">
                          <FaClipboardList className="h-4 w-4" />
                          {item.label}
                        </span>
                      </Link>
                    ))}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2.5 xl:gap-3">
                {desktopProfileAction}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {currentUser?.prom_status !== 'subscription' && (
        <div className="mx-auto mt-3 hidden w-full max-w-[1480px] px-3 md:block">
          <div className="gold-shimmer overflow-hidden rounded-[22px] border border-white/15 px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col items-start justify-between gap-3 text-black lg:flex-row lg:items-center">
              <p className="text-sm font-semibold lg:text-[0.95rem]">
                Загружай до 15 битов в день, пополняй баланс без комиссии и отключи
                рекламу с подпиской всего за 300 ₽ / мес.
              </p>
              <button
                onClick={() => setSubscriptionModalOpen(true)}
                className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-900"
              >
                Оформить подписку
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-3 left-1/2 z-50 w-[calc(100vw-16px)] max-w-[560px] -translate-x-1/2 md:hidden">
        <div className="nav-shell grid grid-cols-5 items-center rounded-[26px] px-2 py-2">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-1 rounded-[18px] px-2 py-2.5 transition ${
              getCurrentPath() === '/' ? 'bg-red-600/85 text-white' : 'text-neutral-300'
            }`}
          >
            <FaHome className="h-5 w-5" />
            <span className="text-[10px]">Главная</span>
          </button>
          <button
            onClick={() => navigate('/beats')}
            className={`flex flex-col items-center gap-1 rounded-[18px] px-2 py-2.5 transition ${
              getCurrentPath() === '/beats' ? 'bg-red-600/85 text-white' : 'text-neutral-300'
            }`}
          >
            <FaMusic className="h-5 w-5" />
            <span className="text-[10px]">Биты</span>
          </button>
          <button
            onClick={() => navigate('/beatmakers')}
            className={`flex flex-col items-center gap-1 rounded-[18px] px-2 py-2.5 transition ${
              getCurrentPath() === '/beatmakers'
                ? 'bg-red-600/85 text-white'
                : 'text-neutral-300'
            }`}
          >
            <FaUsers className="h-5 w-5" />
            <span className="text-[10px]">Авторы</span>
          </button>
          <button
            onClick={() => (currentUser || isAuthenticated ? navigate('/profile') : setAuthModalOpen(true))}
            className={`flex flex-col items-center gap-1 rounded-[18px] px-2 py-2.5 transition ${
              getCurrentPath() === '/profile' ? 'bg-red-600/85 text-white' : 'text-neutral-300'
            }`}
          >
            <FaUser className="h-5 w-5" />
            <span className="text-[10px]">Профиль</span>
          </button>
          <button
            onClick={() => navigate('/support')}
            className={`flex flex-col items-center gap-1 rounded-[18px] px-2 py-2.5 transition ${
              getCurrentPath() === '/support'
                ? 'bg-red-600/85 text-white'
                : 'text-neutral-300'
            }`}
          >
            <FaQuestionCircle className="h-5 w-5" />
            <span className="text-[10px]">FAQ</span>
          </button>
        </div>
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      <AddBeatModal isOpen={addBeatModalOpen} onClose={() => setAddBeatModalOpen(false)} />

      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
      />
    </>
  );
};

export default Header;
