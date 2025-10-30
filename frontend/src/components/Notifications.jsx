import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import useNotifications from '../hooks/useNotifications';
import './Notifications.css';

const Notifications = () => {
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    fetchNotifications,
    deleteNotification,
    deleteAllNotifications 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);

  // Obsługa kliknięcia poza dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.notifications-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Przed chwilą';
    if (diffInMinutes < 60) return `${diffInMinutes} min temu`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} godz. temu`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} dni temu`;
    
    return notificationDate.toLocaleDateString('pl-PL');
  };

  return (
    <div className="notifications-container">
      <button
        className="notifications-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Powiadomienia"
        title={`${unreadCount} nieprzeczytanych powiadomień`}
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Powiadomienia</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
                title="Oznacz wszystkie jako przeczytane"
              >
                Oznacz wszystkie
              </button>
            )}
          </div>

          <div className="notifications-content">
            {loading ? (
              <div className="notifications-loading">
                <div className="loading-spinner-small"></div>
                <span>Ładowanie powiadomień...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notifications-empty">
                <div className="empty-icon">🔔</div>
                <p>Brak nowych powiadomień</p>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      {notification.type === 'review' ? '⭐' : '📝'}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">
                        {notification.title}
                      </div>
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      <div className="notification-time">
                        {formatTimeAgo(notification.created_at || notification.createdAt)}
                      </div>
                    </div>
                    <button
                      className="notification-delete-btn"
                      aria-label="Usuń powiadomienie"
                      title="Usuń"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      ✖
                    </button>
                    {!notification.read && (
                      <div className="notification-dot"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notifications-footer">
              <button 
                className="view-all-btn"
                onClick={() => {
                  deleteAllNotifications();
                }}
              >
                Usuń wszystkie
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
