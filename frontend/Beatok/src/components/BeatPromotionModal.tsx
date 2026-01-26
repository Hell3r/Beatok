import React, { useState, useEffect } from 'react';
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
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    }
  }, [isOpen]);

  const modalSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'scale(1)' : 'scale(0.9)',
    config: { tension: 300, friction: 25 },
    onRest: () => {
      if (!isOpen) {
        setShouldRender(false);
      }
    }
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

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  if (!shouldRender || !beat) return null;

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
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="text-white font-medium text-lg mb-2">{beat.name}</h3>
              <p className="text-neutral-400 text-sm mb-4">{beat.genre} • {beat.tempo} BPM</p>
              <div className="text-center">
                <span className="text-neutral-400 text-sm">Стоимость продвижения:</span>
                <div className="text-white font-bold text-2xl mt-1">200 ₽</div>
                <div className="text-neutral-500 text-xs">за неделю</div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handlePromote}
              disabled={isProcessing}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Обработка...' : 'Продвинуть'}
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
