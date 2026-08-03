import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { apiUrl } from '../services/api';

interface AvatarDropdownProps {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  isOpen: boolean;
  onClose: () => void;
}

interface DropdownPosition {
  left: number;
  top: number;
}

const DROPDOWN_WIDTH = 224;
const MENU_ITEMS = [
  { to: '/profile?tab=info', label: '\u041f\u0440\u043e\u0444\u0438\u043b\u044c' },
  { to: '/profile?tab=balance', label: '\u0411\u0430\u043b\u0430\u043d\u0441' },
  { to: '/profile?tab=mybeats', label: '\u041c\u043e\u0438 \u0431\u0438\u0442\u044b' },
  { to: '/profile?tab=stats', label: '\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430' },
  { to: '/profile?tab=favorites', label: '\u0418\u0437\u0431\u0440\u0430\u043d\u043d\u043e\u0435' },
  { to: '/profile?tab=history', label: '\u0418\u0441\u0442\u043e\u0440\u0438\u044f' },
  { to: '/profile?tab=requests', label: '\u0417\u0430\u044f\u0432\u043a\u0438' },
] as const;

const AvatarDropdown: React.FC<AvatarDropdownProps> = ({ anchorRef, isOpen, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<DropdownPosition>({ left: 0, top: 0 });

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const left = Math.min(
        Math.max(12, rect.right - DROPDOWN_WIDTH),
        window.innerWidth - DROPDOWN_WIDTH - 12,
      );

      setPosition({
        left,
        top: rect.bottom + 12,
      });
    };

    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (dropdownRef.current?.contains(target) || anchorRef.current?.contains(target)) {
        return;
      }

      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [anchorRef, isOpen, onClose]);

  const handleLinkClick = () => {
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      ref={dropdownRef}
      role="menu"
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        width: DROPDOWN_WIDTH,
        background:
          'linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.018) 18%, transparent 52%), rgba(7, 10, 16, 0.7)',
        backdropFilter: 'blur(20px) saturate(1.08)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.08)',
      }}
      className="glass-panel-strong z-[220] overflow-hidden p-2 shadow-[0_24px_64px_rgba(0,0,0,0.4)]"
    >
      <div className="space-y-1">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={handleLinkClick}
            className="block rounded-2xl px-4 py-2.5 text-sm text-neutral-300 transition-colors duration-200 hover:bg-white/8 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
        <hr className="my-2 border-white/10" />
        <button
          type="button"
          onClick={() => {
            handleLinkClick();
            const token = localStorage.getItem('access_token');
            if (token) {
              fetch(apiUrl('/v1/users/logout'), {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }).catch((error) => console.error('Logout error:', error));
            }
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_info');
            window.location.reload();
          }}
          className="block w-full rounded-2xl px-4 py-2.5 text-left text-sm text-neutral-300 transition-colors duration-200 hover:bg-white/8 hover:text-white"
        >
          {'\u0412\u044b\u0439\u0442\u0438'}
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default AvatarDropdown;
