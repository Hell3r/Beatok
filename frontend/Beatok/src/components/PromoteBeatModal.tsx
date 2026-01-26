import React from 'react';
import { useTransition, animated } from '@react-spring/web';

interface PromoteBeatModal {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  beatName: string;
  loading?: boolean;
}

const PromoteBeatModal: React.FC<PromoteBeatModal> = ({
  isOpen,
  onClose,
  onConfirm,
  beatName,
  loading = false
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
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

  return (
    <>
      {overlayTransition((style, item) =>
        item && (
          <animated.div
            style={style}
            className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"
            onClick={handleClose}
          />
        )
      )}

      {modalTransition((style, item) =>
        item && (
          <animated.div
            style={style}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 select-none"
          >
            <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-700 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mb-4">
                  <svg
                    className="w-12 h-12 mx-auto mb-4 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Подтверждение удаления
                  </h3>
                  <p className="text-neutral-300">
                    Вы уверены, что хотите удалить бит "{beatName}"?
                  </p>
                  <p className="text-neutral-400 text-sm mt-2">
                    Это действие нельзя отменить. Будут удалены все связанные аудиофайлы.
                  </p>
                </div>

                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none"
                  >
                    {loading ? 'Удаление...' : 'Да, удалить'}
                  </button>
                </div>
              </div>
            </div>
          </animated.div>
        )
      )}
    </>
  );
};

export default PromoteBeatModal;
