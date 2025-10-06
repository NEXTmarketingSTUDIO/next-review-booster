import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import UserNav from './UserNav';
import ClientsPage from '../pages/ClientsPage';
import QRCodePage from '../pages/QRCodePage';
import SettingsPage from '../pages/SettingsPage';
import StatisticsPage from '../pages/StatisticsPage';
import VisitsPage from '../pages/VisitsPage';
import GoogleReviewsPage from '../pages/GoogleReviewsPage';
import ExperimentsPage from '../pages/ExperimentsPage';
import HelpPage from '../pages/HelpPage';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 768);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const profileDropdownRef = useRef(null);

  // Lista elementów menu - odwzorowanie 1:1 z obrazka
  const menuItems = [
    {
      id: 'visits',
      label: 'Twoje spotkania',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar">
          <path d="M8 2v4"></path>
          <path d="M16 2v4"></path>
          <rect width="18" height="18" x="3" y="4" rx="2"></rect>
          <path d="M3 10h18"></path>
        </svg>
      ),
      path: '/dashboard/visits'
    },
    {
      id: 'customers',
      label: 'Twoi Klienci',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="m22 21-3-3m0 0a2 2 0 1 0-2.828-2.828L22 21"></path>
        </svg>
      ),
      path: '/dashboard/customers'
    },
    {
      id: 'review-links',
      label: 'Wygeneruj kody QR',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-qr-code">
          <rect width="5" height="5" x="3" y="3" rx="1"></rect>
          <rect width="5" height="5" x="16" y="3" rx="1"></rect>
          <rect width="5" height="5" x="3" y="16" rx="1"></rect>
          <path d="M21 16h-3a2 2 0 0 0-2 2v3"></path>
          <path d="M21 21v.01"></path>
          <path d="M12 7v3a2 2 0 0 1-2 2H7"></path>
          <path d="M3 12h.01"></path>
          <path d="M12 3h.01"></path>
          <path d="M12 16v.01"></path>
          <path d="M16 12h1"></path>
          <path d="M21 12v.01"></path>
          <path d="M12 21v-1"></path>
        </svg>
      ),
      path: '/dashboard/review-links'
    },
    {
      id: 'statistics',
      label: 'Twoje rezultaty',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bar-chart-3">
          <path d="M3 3v18h18"></path>
          <path d="M18 17V9"></path>
          <path d="M13 17V5"></path>
          <path d="M8 17v-3"></path>
        </svg>
      ),
      path: '/dashboard/statistics'
    },
    {
      id: 'google-reviews',
      label: 'Twoje opinie Google',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
        </svg>
      ),
      path: '/dashboard/google_reviews'
    },
    {
      id: 'experiments',
      label: 'Wybierz wariant komunikatu',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-test-tube">
          <path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5V2"></path>
          <path d="M8.5 2h7"></path>
          <path d="M14.5 16h-5"></path>
        </svg>
      ),
      path: '/dashboard/experiments'
    },
    {
      id: 'settings',
      label: 'Ustawienia',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      ),
      path: '/dashboard/settings'
    },
    {
      id: 'help',
      label: 'Pomoc',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-help-circle">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" x2="12.01" y1="17" y2="17"></line>
        </svg>
      ),
      path: '/dashboard/help'
    }
  ];

  // Sprawdź czy element menu jest aktywny
  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  // Obsługa kliknięcia w logo - przekieruj na dashboard
  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  // Obsługa rozwijania/zamykania menu profilu
  const toggleProfileDropdown = () => {
    console.log('🔄 Toggle profile dropdown clicked, current state:', isProfileDropdownOpen);
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  // Zamykanie menu po kliknięciu poza nim
  const closeProfileDropdown = (event) => {
    if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
      console.log('🔄 Closing profile dropdown - clicked outside');
      setIsProfileDropdownOpen(false);
    }
  };

  useEffect(() => {
    console.log('🔄 Setting up profile dropdown event listeners');
    document.addEventListener('mousedown', closeProfileDropdown);
    return () => {
      console.log('🔄 Cleaning up profile dropdown event listeners');
      document.removeEventListener('mousedown', closeProfileDropdown);
    };
  }, [closeProfileDropdown]);

  // Obsługa zmiany rozmiaru okna
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setSidebarCollapsed(false); // Na desktop domyślnie otwarty
      } else {
        setSidebarCollapsed(true); // Na mobile domyślnie zamknięty
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="dashboard-layout">
      {/* Mobile Overlay */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="mobile-overlay"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
          <aside 
            className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
            aria-label="Navigation sidebar"
            data-state={sidebarCollapsed ? 'collapsed' : 'expanded'}
          >
        <div className="sidebar-inner">
          {/* Header */}
          <div className="sidebar-header">
            <Link to="/" className="sidebar-logo-link" onClick={handleLogoClick}>
              <img src="/images/NEXT_reviews_BOOSTER_LOGO.jpg" alt="LOGO NRB" />
            </Link>
          </div>

          {/* Content */}
          <div className="sidebar-content">
            <div className="sidebar-group">
              <ul className="sidebar-menu">
                {menuItems.map((item) => (
                      <li key={item.id} className="sidebar-menu-item">
                        <Link to={item.path} className="menu-link">
                          <button 
                            className={`sidebar-menu-button ${isActive(item.path) ? 'active' : ''}`}
                            data-active={isActive(item.path)}
                            aria-current={isActive(item.path) ? 'page' : undefined}
                            role="menuitem"
                          >
                        {item.icon}
                        <span>{item.label}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right ml-auto">
                          <path d="m9 18 6-6-6-6"></path>
                        </svg>
                      </button>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="sidebar-footer" ref={profileDropdownRef}>
            <ul className="sidebar-menu">
                  <li className="sidebar-menu-item" onClick={toggleProfileDropdown}>
                    <button 
                      className="sidebar-menu-button footer-button"
                      aria-haspopup="menu"
                      aria-expanded={isProfileDropdownOpen}
                      data-state={isProfileDropdownOpen ? 'open' : 'closed'}
                      role="button"
                    >
                  <span className="avatar-fallback">
                    {user?.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="Avatar użytkownika" 
                        className="user-avatar-img"
                      />
                    ) : (
                      <span className="user-avatar-initial">
                        {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  {!sidebarCollapsed && (
                    <>
                      <div className="footer-text">
                        <span className="footer-title">{user?.displayName || 'Użytkownik'}</span>
                        <span className="footer-id">{user?.email}</span>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevrons-up-down ml-auto size-4">
                        <path d="m7 15 5 5 5-5"></path>
                        <path d="m7 9 5-5 5 5"></path>
                      </svg>
                    </>
                  )}
                </button>
              </li>
            </ul>

            {/* Rozwijane menu profilu */}
                {isProfileDropdownOpen && !sidebarCollapsed && (
                  <div 
                    className="profile-dropdown-menu"
                    role="menu"
                    aria-labelledby="user-profile"
                    data-state={isProfileDropdownOpen ? 'open' : 'closed'}
                  >
                <div className="profile-dropdown-header">
                  <span className="avatar-fallback large">
                    {user?.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="Avatar użytkownika" 
                        className="user-avatar-img"
                      />
                    ) : (
                      <span className="user-avatar-initial large">
                        {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <div className="user-details-large">
                    <span className="user-name-large">{user?.displayName || 'Użytkownik'}</span>
                    <span className="user-email-large">{user?.email}</span>
                    {user?.emailVerified && (
                      <span className="email-verified">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check h-4 w-4">
                          <path d="M18 6 7 17l-5-5"/>
                        </svg>
                        Email zweryfikowany
                      </span>
                    )}
                  </div>
                </div>
                <ul className="profile-dropdown-list">
                      <li>
                        <Link 
                          to="/dashboard/review-links" 
                          className="profile-dropdown-item" 
                          onClick={() => setIsProfileDropdownOpen(false)}
                          role="menuitem"
                          tabIndex={0}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-smartphone h-4 w-4">
                            <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
                            <path d="M12 18h.01"></path>
                          </svg>
                          Wygeneruj kody QR
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/dashboard/settings" 
                          className="profile-dropdown-item" 
                          onClick={() => setIsProfileDropdownOpen(false)}
                          role="menuitem"
                          tabIndex={0}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings h-4 w-4">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.78 1.35a2 2 0 0 0 .73 2.73l.15.08a2 2 0 0 1 1 1.73v.44a2 2 0 0 1-1 1.73l-.15.08a2 2 0 0 0-.73 2.73l.78 1.35a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 1 1.73v.44a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.78-1.35a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.73v-.44a2 2 0 0 1 1-1.73l.15-.08a2 2 0 0 0 .73-2.73l-.78-1.35a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          Ustawienia
                        </Link>
                      </li>
                      <li>
                        <button 
                          className="profile-dropdown-item logout-button" 
                          onClick={() => { logout(); setIsProfileDropdownOpen(false); }}
                          role="menuitem"
                          tabIndex={0}
                        >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out h-4 w-4">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16,17 21,12 16,7"></polyline>
                        <line x1="21" x2="9" y1="12" y2="12"></line>
                      </svg>
                      Wyloguj się
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Rail Button */}
          <button 
            className="sidebar-rail"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Toggle Sidebar"
            title="Toggle Sidebar"
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className={`dashboard-main ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Top Bar */}
        <header className="dashboard-header">
          <div className="header-left">
            {/* Strzałka w lewym górnym rogu - zawsze widoczna */}
            <button 
              className="sidebar-toggle-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label="Toggle Sidebar"
              title="Toggle Sidebar"
              aria-expanded={!sidebarCollapsed}
              data-state={sidebarCollapsed ? 'collapsed' : 'expanded'}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {sidebarCollapsed ? (
                  // Strzałka w prawo gdy sidebar jest zamknięty
                  <path d="M9 18l6-6-6-6"/>
                ) : (
                  // Strzałka w lewo gdy sidebar jest otwarty
                  <path d="M15 18l-6-6 6-6"/>
                )}
              </svg>
            </button>
            
            <div className="header-content">
              <h1>
                {location.pathname.startsWith('/dashboard/visits') && 'Twoje spotkania'}
                {location.pathname.startsWith('/dashboard/customers') && 'Twoi Klienci'}
                {location.pathname.startsWith('/dashboard/review-links') && 'Wygeneruj kody QR'}
                {location.pathname.startsWith('/dashboard/statistics') && 'Dashboard'}
                {location.pathname.startsWith('/dashboard/google_reviews') && 'Twoje opinie Google'}
                {location.pathname.startsWith('/dashboard/experiments') && 'Wybierz wariant komunikatu'}
                {location.pathname.startsWith('/dashboard/settings') && 'Ustawienia'}
                {location.pathname.startsWith('/dashboard/help') && 'Pomoc'}
              </h1>
              <p className="subtitle">

                {location.pathname.startsWith('/dashboard/visits') && 'Śledź twoje spotkania'}
                {location.pathname.startsWith('/dashboard/customers') && 'Zarządzaj bazą Klientów'}
                {location.pathname.startsWith('/dashboard/review-links') && 'Wygeneruj kody QR dla firmy'}
                {location.pathname.startsWith('/dashboard/statistics') && 'Dashboard'}
                {location.pathname.startsWith('/dashboard/google_reviews') && 'Zarządzaj twoimi opiniami Google'}
                {location.pathname.startsWith('/dashboard/experiments') && 'Testuj różne wersje komunikatu'}
                {location.pathname.startsWith('/dashboard/settings') && 'Konfiguruj platformę'}
                {location.pathname.startsWith('/dashboard/help') && 'Instrukcje korzystania z platformy'}
              </p>
            </div>
          </div>
          <div className="header-right">
            {/* UserNav functionality moved to sidebar footer */}
          </div>
        </header>

        {/* Page Content */}
        <div className="dashboard-content">
          <Routes>
            <Route path="/" element={<StatisticsPage />} />
            <Route path="/visits" element={<VisitsPage />} />
            <Route path="/customers" element={<ClientsPage />} />
            <Route path="/review-links" element={<QRCodePage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/google_reviews" element={<GoogleReviewsPage />} />
            <Route path="/experiments" element={<ExperimentsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<HelpPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;