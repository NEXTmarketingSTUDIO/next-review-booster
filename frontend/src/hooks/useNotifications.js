import { useState, useEffect, useCallback } from 'react';
import useAuth from './useAuth';
import apiService from '../services/api';

const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Oblicz liczbę nieprzeczytanych powiadomień
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Pobierz powiadomienia z API
  const fetchNotifications = useCallback(async () => {
    if (!user?.email) {
      setNotifications([]);
      return;
    }

    // Cache na 2 minuty - nie pobieraj powiadomień częściej niż co 2 minuty
    const now = Date.now();
    const cacheTime = 2 * 60 * 1000; // 2 minuty w milisekundach
    
    if (now - lastFetchTime < cacheTime) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getNotifications(user.email);
      
      if (response.success) {
        setNotifications(response.notifications || []);
        setLastFetchTime(now);
      } else {
        setError(response.error || 'Błąd pobierania powiadomień');
      }
    } catch (err) {
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  }, [user?.email, lastFetchTime]);

  // Oznacz powiadomienie jako przeczytane
  const markAsRead = useCallback(async (notificationId) => {
    if (!user?.email) return;

    try {
      console.log('📖 Oznaczanie powiadomienia jako przeczytane:', notificationId);
      const response = await apiService.markNotificationAsRead(user.email, notificationId);
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
        console.log('✅ Powiadomienie oznaczone jako przeczytane');
      } else {
        console.error('❌ Błąd oznaczania powiadomienia:', response.error);
      }
    } catch (err) {
      console.error('❌ Błąd oznaczania powiadomienia:', err);
    }
  }, [user?.email]);

  // Oznacz wszystkie powiadomienia jako przeczytane
  const markAllAsRead = useCallback(async () => {
    if (!user?.email || unreadCount === 0) return;

    try {
      console.log('📖 Oznaczanie wszystkich powiadomień jako przeczytane');
      const response = await apiService.markAllNotificationsAsRead(user.email);
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
        console.log('✅ Wszystkie powiadomienia oznaczone jako przeczytane');
      } else {
        console.error('❌ Błąd oznaczania wszystkich powiadomień:', response.error);
      }
    } catch (err) {
      console.error('❌ Błąd oznaczania wszystkich powiadomień:', err);
    }
  }, [user?.email, unreadCount]);

  // Dodaj nowe powiadomienie (do użycia w przyszłości)
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
  }, []);

  // Usuń powiadomienie
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  }, []);

  // Pobierz powiadomienia przy załadowaniu użytkownika i co 30 sekund
  useEffect(() => {
    if (!user?.email) {
      setNotifications([]);
      return;
    }

    // Pobierz od razu przy załadowaniu
    fetchNotifications();

    // Ustaw interval dla automatycznego odświeżania
    const interval = setInterval(() => {
      fetchNotifications();
    }, 2 * 60 * 1000); // 2 minuty

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]); // Celowo pomijamy fetchNotifications w zależnościach

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification
  };
};

export default useNotifications;
