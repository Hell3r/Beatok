import React, { useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import type { Beat } from '../types/Beat';

interface BeatPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  beat: Beat | null;
  onPromote: (beatId: number) => void;
}

const BeatPromotionModal: React.FC<BeatPromotionModalProps> = ({
  isOpen,
  onClose,
  beat,
  onPromote,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const modalSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'scale(1)' : 'scale(0.9)',
    config: { tension: 300, friction: 25 }
  });

  const overlaySpring = useSpring({
    opacity: isOpen ? 1 : 0,
    config: { tension: 300, friction: 25 }
  });

  const handlePromote = async () => {
    if (!beat) return;

    setIsProcessing(true);
    try {
      await onPromote(beat.id);
      onClose();
    } catch (error) {
      console.error('Failed to promote beat:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !beat) return null;

  return (
    <>
      <animated.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        style={overlaySpring}
        onClick={onClose}
      />

      <animated.div
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        style={modalSpring}
      >
        <div className="bg-neutral-800 rounded-lg p-6 max-w-md w-full border border-neutral-600 select-none">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Продвижение бита</h2>
            <p className="text-neutral-400 text-sm">
              Ваш бит будет показан в разделе "В центре внимания" на главной странице
            </p>
          </div>

          <div className="bg-neutral-900 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-neutral-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium truncate">{beat.name}</h3>
                <p className="text-neutral-400 text-sm">{beat.genre} • {beat.tempo} BPM</p>
              </div>
            </div>

            <div className="border-t border-neutral-700 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Стоимость продвижения:</span>
                <span className="text-white font-semibold">200 ₽ / неделя</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handlePromote}
              disabled={isProcessing}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Обработка...' : 'Купить продвижение'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
              disabled={isProcessing}
            >
              Отмена
            </button>
          </div>
        </div>
      </animated.div>
    </>
  );
};

export default BeatPromotionModal;
