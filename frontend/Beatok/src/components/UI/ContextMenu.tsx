import React from 'react';
import { useSpring, animated } from '@react-spring/web';

interface ContextMenuProps {
  x: number;
  y: number;
  onDelete: () => void;
  onPromote: () => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onDelete, onPromote, onClose }) => {
  const menuSpring = useSpring({
    from: { opacity: 0, scale: 0.8, transformOrigin: 'top left' },
    to: { opacity: 1, scale: 1 },
    config: { tension: 300, friction: 20 }
  });

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  const handlePromote = () => {
    onPromote();
    onClose();
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={handleClickOutside}
        onContextMenu={handleClickOutside}
      />

      <animated.div
        className="fixed z-50 bg-neutral-800 border border-neutral-600 rounded-lg shadow-lg py-2 min-w-[140px]"
        style={{
          left: x,
          top: y,
          ...menuSpring,
        }}
      >
        <button
          onClick={handlePromote}
          className="w-full text-left px-4 py-2 text-yellow-400 hover:bg-neutral-700 hover:text-yellow-300 transition-colors cursor-pointer select-none"
        >
          Продвигать
        </button>
        <button
          onClick={handleDelete}
          className="w-full text-left px-4 py-2 text-red-400 hover:bg-neutral-700 hover:text-red-300 transition-colors cursor-pointer select-none"
        >
          Удалить
        </button>
      </animated.div>
    </>
  );
};

export default ContextMenu;
