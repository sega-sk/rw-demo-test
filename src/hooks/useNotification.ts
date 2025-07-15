import { useState, useCallback } from 'react';
import { NotificationType } from '../components/UI/NotificationBanner';

export function useNotification() {
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
  } | null>(null);

  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const clearNotification = useCallback(() => setNotification(null), []);

  return { notification, showNotification, clearNotification };
}
