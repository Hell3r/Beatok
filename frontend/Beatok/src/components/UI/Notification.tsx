import React, { useEffect, useState } from 'react';

export type NotificationType = 'success' | 'error';

export interface NotificationData {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationProps {
  notification: NotificationData;
  onClose: (id: string) => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    const hideTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(notification.id), 300);
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [notification.id, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(notification.id), 300);
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full transition-all duration-300 transform select-none ${
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className={`p-4 rounded-lg shadow-lg border backdrop-blur-sm select-none ${
          notification.type === 'success'
            ? 'bg-green-500/90 border-green-400 text-white'
            : 'bg-red-500/90 border-red-400 text-white'
        }`}
      >
        <div className="flex items-start justify-between select-none">
          <div className="flex-1 pr-2">
            <p className="text-sm font-medium leading-relaxed">
              {notification.message}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-2 text-white/80 hover:text-white transition-colors"
            aria-label="Закрыть уведомление"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
