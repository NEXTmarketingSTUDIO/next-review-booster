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
      id: 'review-requests',
      label: 'Wysyłka prośby o opinię',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-scroll-text">
          <path d="M15 12h-5"></path>
          <path d="M15 8h-5"></path>
          <path d="M19 17V5a2 2 0 0 0-2-2H4"></path>
          <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"></path>
        </svg>
      ),
      path: '/dashboard'
    },
    {
      id: 'visits',
      label: 'Twoje spotkania',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-days">
          <path d="M8 2v4"></path>
          <path d="M16 2v4"></path>
          <rect width="18" height="18" x="3" y="4" rx="2"></rect>
          <path d="M3 10h18"></path>
          <path d="M8 14h.01"></path>
          <path d="M12 14h.01"></path>
          <path d="M16 14h.01"></path>
          <path d="M8 18h.01"></path>
          <path d="M12 18h.01"></path>
          <path d="M16 18h.01"></path>
        </svg>
      ),
      path: '/dashboard/visits'
    },
    {
      id: 'customers',
      label: 'Twoi Klienci',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-round">
          <circle cx="12" cy="8" r="5"></circle>
          <path d="M20 21a8 8 0 0 0-16 0"></path>
        </svg>
      ),
      path: '/dashboard/customers'
    },
    {
      id: 'review-links',
      label: 'Wygeneruj kody QR',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link2">
          <path d="M9 17H7A5 5 0 0 1 7 7h2"></path>
          <path d="M15 7h2a5 5 0 1 1 0 10h-2"></path>
          <line x1="8" x2="16" y1="12" y2="12"></line>
        </svg>
      ),
      path: '/dashboard/review-links'
    },
    {
      id: 'statistics',
      label: 'Twoje rezultaty',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chart-no-axes-column">
          <line x1="18" x2="18" y1="20" y2="10"></line>
          <line x1="12" x2="12" y1="20" y2="4"></line>
          <line x1="6" x2="6" y1="20" y2="14"></line>
        </svg>
      ),
      path: '/dashboard/statistics'
    },
    {
      id: 'google-reviews',
      label: 'Twoje opinie Google',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star">
          <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
        </svg>
      ),
      path: '/dashboard/google_reviews'
    },
    {
      id: 'experiments',
      label: 'Wybierz wariant komunikatu',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-flask-conical">
          <path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"></path>
          <path d="M6.453 15h11.094"></path>
          <path d="M8.5 2h7"></path>
        </svg>
      ),
      path: '/dashboard/experiments'
    },
    {
      id: 'settings',
      label: 'Ustawienia',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings2">
          <path d="M20 7h-9"></path>
          <path d="M14 17H5"></path>
          <circle cx="17" cy="17" r="3"></circle>
          <circle cx="7" cy="7" r="3"></circle>
        </svg>
      ),
      path: '/dashboard/settings'
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
      <main className="dashboard-main">
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
                {location.pathname === '/dashboard' && 'Wysyłka prośby o opinię'}
                {location.pathname.startsWith('/dashboard/visits') && 'Twoje spotkania'}
                {location.pathname.startsWith('/dashboard/customers') && 'Twoi Klienci'}
                {location.pathname.startsWith('/dashboard/review-links') && 'Wygeneruj kody QR'}
                {location.pathname.startsWith('/dashboard/statistics') && 'Dashboard'}
                {location.pathname.startsWith('/dashboard/google_reviews') && 'Twoje opinie Google'}
                {location.pathname.startsWith('/dashboard/experiments') && 'Wybierz wariant komunikatu'}
                {location.pathname.startsWith('/dashboard/settings') && 'Ustawienia'}
              </h1>
              <p className="subtitle">
                {location.pathname === '/dashboard' && 'Zarządzaj wysyłką prośby o opinię'}
                {location.pathname.startsWith('/dashboard/visits') && 'Śledź twoje spotkania'}
                {location.pathname.startsWith('/dashboard/customers') && 'Zarządzaj bazą Klientów'}
                {location.pathname.startsWith('/dashboard/review-links') && 'Wygeneruj kody QR dla firmy'}
                {location.pathname.startsWith('/dashboard/statistics') && 'Dashboard'}
                {location.pathname.startsWith('/dashboard/google_reviews') && 'Zarządzaj twoimi opiniami Google'}
                {location.pathname.startsWith('/dashboard/experiments') && 'Testuj różne wersje komunikatu'}
                {location.pathname.startsWith('/dashboard/settings') && 'Konfiguruj platformę'}
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
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;