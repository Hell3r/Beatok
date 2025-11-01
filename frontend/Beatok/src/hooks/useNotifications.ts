import { useState, useCallback } from 'react';
import type { NotificationData, NotificationType } from '../components/UI/Notification';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = useCallback((type: NotificationType, message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const notification: NotificationData = {
      id,
      type,
      message,
    };

    setNotifications(prev => [...prev, notification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showSuccess = useCallback((message: string) => {
    addNotification('success', message);
  }, [addNotification]);

  const showError = useCallback((message: string) => {
    addNotification('error', message);
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
  };
};
