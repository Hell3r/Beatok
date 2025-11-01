import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onDelete: () => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onDelete, onClose }) => {
  const handleDelete = () => {
    onDelete();
    onClose();
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <>
      {/* Overlay для закрытия меню */}
      <div
        className="fixed inset-0 z-40"
        onClick={handleClickOutside}
        onContextMenu={handleClickOutside}
      />

      {/* Контекстное меню */}
      <div
        className="fixed z-50 bg-neutral-800 border border-neutral-600 rounded-lg shadow-lg py-2 min-w-[120px]"
        style={{
          left: x,
          top: y,
        }}
      >
        <button
          onClick={handleDelete}
          className="w-full text-left px-4 py-2 text-red-400 hover:bg-neutral-700 hover:text-red-300 transition-colors cursor-pointer select-none"
        >
          Удалить
        </button>
      </div>
    </>
  );
};

export default ContextMenu;
