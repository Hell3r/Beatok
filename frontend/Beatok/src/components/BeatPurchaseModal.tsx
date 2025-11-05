import React from 'react';
import { useTransition, animated } from '@react-spring/web';
import type { Beat } from '../types/Beat';
import { useModal } from '../hooks/useModal';

interface BeatPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  beat: Beat | null;
}

const BeatPurchaseModal: React.FC<BeatPurchaseModalProps> = ({ isOpen, onClose, beat }) => {
  const { openModal, closeModal } = useModal();

  React.useEffect(() => {
    if (isOpen) {
      openModal();
    } else {
      closeModal();
    }
  }, [isOpen, openModal, closeModal]);

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

  if (!beat) return null;

  const getAuthorName = (beat: Beat): string => {
    if (beat.owner?.username) return beat.owner.username;
    if (beat.author?.username) return beat.author.username;
    if (beat.user?.username) return beat.user.username;
    return 'Неизвестно';
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };


  const availablePricings = beat.pricings?.filter(p => p.is_available && p.price !== null) || [];

  return (
    <>
      {overlayTransition((style, item) =>
        item && (
          <animated.div
            style={style}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
        )
      )}

      {modalTransition((style, item) =>
        item && (
          <animated.div
            style={style}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div className="bg-neutral-900 rounded-lg w-full max-w-2xl border border-neutral-700 shadow-2xl max-h-[90vh] overflow-y-auto pointer-events-auto">
              <div className="p-6 border-b border-neutral-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{beat.name}</h2>
                    <p className="text-neutral-400">Автор: {getAuthorName(beat)}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-neutral-400 cursor-pointer hover:text-white transition-colors"
                    aria-label="Закрыть"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-sm text-neutral-400 mb-1">Жанр</div>
                    <div className="text-white font-medium">{beat.genre}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-neutral-400 mb-1">Темп</div>
                    <div className="text-white font-medium">{beat.tempo} BPM</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-neutral-400 mb-1">Тональность</div>
                    <div className="text-white font-medium">{beat.key}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-neutral-400 mb-1">Длительность</div>
                    <div className="text-white font-medium">{formatDuration(beat.duration)}</div>
                  </div>
                </div>


                <div className="border-t border-neutral-700 pt-6">
                  <h3 className="text-xl font-bold text-white mb-4">Выберите тариф</h3>

                  {availablePricings.length > 0 ? (
                    <div className="space-y-3">
                      {availablePricings.map((pricing) => (
                        <div
                          key={pricing.id}
                          className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg border border-neutral-600 hover:border-red-500 transition-colors cursor-pointer"
                        >
                          <div>
                            <div className="text-white font-medium">
                              {pricing.tariff_display_name || pricing.tariff_name}
                            </div>
                            <div className="text-neutral-400 text-sm">
                              {pricing.tariff_name.toLowerCase().includes('leasing') ? 'Лицензия на использование' :
                               pricing.tariff_name.toLowerCase().includes('exclusive') ? 'Полные права на бит' :
                               'Тариф'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold text-lg">
                              {pricing.price} ₽
                            </div>
                            <button className="mt-2 bg-red-600 cursor-pointer hover:bg-red-700 text-white px-4 py-2 rounded transition-colors">
                              Купить
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-400">
                      Цены для этого бита не установлены
                    </div>
                  )}
                </div>
              </div>
            </div>
          </animated.div>
        )
      )}
    </>
  );
};

export default BeatPurchaseModal;
