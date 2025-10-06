// Komponent nawigacji użytkownika
// Wyświetla informacje o zalogowanym użytkowniku i opcje wylogowania

import React, { useState, useEffect } from 'react';
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
  useEffect(() => {
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18"></path>
                  <path d="M18 17V9"></path>
                  <path d="M13 17V5"></path>
                  <path d="M8 17v-3"></path>
                </svg>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="m22 21-3-3m0 0a2 2 0 1 0-2.828-2.828L22 21"></path>
                </svg>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
                  <path d="M12 18h.01"></path>
                </svg>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22,7 13.5,15.5 8.5,10.5 2,17"></polyline>
                  <polyline points="16,7 22,7 22,13"></polyline>
                </svg>
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
              <span className="icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </span>
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16,17 21,12 16,7"></polyline>
                    <line x1="21" x2="9" y1="12" y2="12"></line>
                  </svg>
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
