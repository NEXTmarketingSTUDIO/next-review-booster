// Komponent nawigacji użytkownika
// Wyświetla informacje o zalogowanym użytkowniku i opcje wylogowania

import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import './UserNav.css';

const UserNav = () => {
  const { user, logout, isEmailVerified } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Obsługa wylogowania
  const handleLogout = async () => {
    setLoggingOut(true);
    
    try {
      const success = await logout();
      if (success) {
        console.log('✅ Wylogowanie udane');
        setShowDropdown(false);
      }
    } catch (error) {
      console.error('❌ Błąd wylogowania:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  // Obsługa kliknięcia poza dropdown
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.user-nav')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  if (!user) {
    return null;
  }

  return (
    <div className="user-nav">
      <div 
        className="user-profile"
        onClick={() => setShowDropdown(!showDropdown)}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={showDropdown}
        data-state={showDropdown ? 'open' : 'closed'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowDropdown(!showDropdown);
          }
        }}
      >
        <div className="user-avatar">
          {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
        </div>
        <div className="user-info">
          <span className="user-name">
            {user.displayName || 'Użytkownik'}
          </span>
          <span className="user-email">
            {user.email}
          </span>
        </div>
        <div className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}>
          ▼
        </div>
      </div>

      {showDropdown && (
        <div 
          className="user-dropdown"
          role="menu"
          aria-labelledby="user-profile"
          data-state={showDropdown ? 'open' : 'closed'}
        >
          <div className="dropdown-header">
            <div className="user-avatar-large">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <h4>{user.displayName || 'Użytkownik'}</h4>
              <p>{user.email}</p>
              <div className="verification-status">
                {isEmailVerified() ? (
                  <span className="verified">✅ Email zweryfikowany</span>
                ) : (
                  <span className="unverified">⚠️ Email niezweryfikowany</span>
                )}
              </div>
            </div>
          </div>

          <div className="dropdown-actions">
            <button 
              className="dropdown-item" 
              onClick={() => window.location.href = '/dashboard'}
              role="menuitem"
              tabIndex={0}
            >
              <span className="icon">
                <i data-feather="bar-chart-2"></i>
              </span>
              Dashboard
            </button>
            <button 
              className="dropdown-item" 
              onClick={() => window.location.href = '/dashboard/customers'}
              role="menuitem"
              tabIndex={0}
            >
              <span className="icon">
                <i data-feather="users"></i>
              </span>
              Klienci
            </button>
            <button 
              className="dropdown-item" 
              onClick={() => window.location.href = '/dashboard/review-links'}
              role="menuitem"
              tabIndex={0}
            >
              <span className="icon">
                <i data-feather="smartphone"></i>
              </span>
              Kody QR
            </button>
            <button 
              className="dropdown-item" 
              onClick={() => window.location.href = '/dashboard/statistics'}
              role="menuitem"
              tabIndex={0}
            >
              <span className="icon">
                <i data-feather="trending-up"></i>
              </span>
              Statystyki
            </button>
            <div className="dropdown-divider"></div>
            <button 
              className="dropdown-item" 
              onClick={() => window.location.href = '/dashboard/settings'}
              role="menuitem"
              tabIndex={0}
            >
              <span className="icon">⚙️</span>
              Ustawienia
            </button>
            <div className="dropdown-divider"></div>
            <button 
              className="dropdown-item logout"
              onClick={handleLogout}
              disabled={loggingOut}
              role="menuitem"
              tabIndex={0}
            >
              <span className="icon">
                {loggingOut ? (
                  <div className="loading-spinner-small"></div>
                ) : (
                  <i data-feather='log-out'></i>
                )}
              </span>
              {loggingOut ? 'Wylogowywanie...' : 'Wyloguj się'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserNav;
