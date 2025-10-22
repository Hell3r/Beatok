import React from 'react';
import type { Beat } from '../types/Beat';

interface RejectionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  beat: Beat | null;
}

const RejectionReasonModal: React.FC<RejectionReasonModalProps> = ({
  isOpen,
  onClose,
  beat,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"
          onClick={onClose}
        />
      )}

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="relative bg-neutral-900 rounded-lg w-full max-w-md border border-neutral-800 shadow-2xl">
            <button
              onClick={onClose}
              className="absolute -top-3 -right-3 cursor-pointer select-none bg-neutral-800 hover:bg-neutral-700 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 z-10 shadow-lg"
              aria-label="Закрыть"
            >
              ×
            </button>

            <div className="p-6 border-b border-neutral-800 justify-center text-center">
              <h3 className="text-xl font-semibold text-white">Причина отклонения</h3>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-neutral-300 text-sm mb-2">Бит:</p>
                <p className="text-white font-medium">{beat?.name}</p>
              </div>

              <div>
                <p className="text-neutral-300 text-sm mb-2">Причина:</p>
                <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                  <p className="text-white whitespace-pre-wrap">{beat?.rejection_reason}</p>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  onClick={onClose}
                  className="bg-red-600 hover:bg-red-700 cursor-pointer select-none text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RejectionReasonModal;
