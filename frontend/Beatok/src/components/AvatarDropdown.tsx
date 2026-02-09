import React, { useEffect, useRef } from 'react';

interface AvatarDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const AvatarDropdown: React.FC<AvatarDropdownProps> = ({ isOpen, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg z-50 animate-in slide-in-from-top-2 fade-in duration-200"
    >
      <div className="py-2">
        <a
          href="/profile?tab=info"
          onClick={handleLinkClick}
          className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors duration-200"
        >
          Профиль
        </a>
        <a
          href="/profile?tab=balance"
          onClick={handleLinkClick}
          className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors duration-200"
        >
          Баланс
        </a>
        <a
          href="/profile?tab=mybeats"
          onClick={handleLinkClick}
          className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors duration-200"
        >
          Мои биты
        </a>
        <a
          href="/profile?tab=stats"
          onClick={handleLinkClick}
          className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors duration-200"
        >
          Статистика
        </a>
        <a
          href="/profile?tab=favorites"
          onClick={handleLinkClick}
          className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors duration-200"
        >
          Избранное
        </a>
        <a
          href="/profile?tab=history"
          onClick={handleLinkClick}
          className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors duration-200"
        >
          История
        </a>
        <hr className="border-neutral-600 my-2" />
        <button
          onClick={() => {
            handleLinkClick();
            const token = localStorage.getItem('access_token');
            if (token) {
              fetch('http://localhost:8000/api/v1/users/logout', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }).catch(error => console.error('Logout error:', error));
            }
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_info');
            window.location.reload();
          }}
          className="block w-full text-left px-4 py-2 text-sm text-neutral-300 cursor-pointer hover:bg-neutral-800 hover:text-white transition-colors duration-200"
        >
          Выйти
        </button>
      </div>
    </div>
  );
};

export default AvatarDropdown;
