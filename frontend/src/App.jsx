import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { apiService } from './services/api';
import useAuth from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import UserNav from './components/UserNav';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ClientsPage from './pages/ClientsPage';
import SettingsPage from './pages/SettingsPage';
import ReviewFormPage from './pages/ReviewFormPage';
import QRCodePage from './pages/QRCodePage';
import ClientLoginPage from './pages/ClientLoginPage';
import './App.css';

// Komponent wewnętrzny z dostępem do useLocation
function AppContent() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Hook autoryzacji Firebase
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  // Strony bez nawigacji
  const noNavRoutes = ['/client-login', '/review'];
  const shouldShowNav = !noNavRoutes.some(route => location.pathname.startsWith(route));

  useEffect(() => {
    checkHealth();
    
    // Sprawdzaj status co 30 sekund
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getHealth();
      setHealthData(data);
      setIsConnected(true);
    } catch (err) {
      console.error('Błąd połączenia z backendem:', err);
      setError('Nie można połączyć się z serwerem. Upewnij się, że FastAPI działa na porcie 8000.');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      {/* Nawigacja - tylko dla stron z nawigacją */}
      {shouldShowNav && (
        <nav className="navigation">
          <div className="container">
            <div className="nav-content">
              <Link to="/" className="logo">
                <span className="logo-next">next</span>
                <span className="logo-reviews">review booster</span>
              </Link>
              
              <div className="nav-links">
                <Link to="/">Strona główna</Link>
                <Link to="/clients">Klienci</Link>
              </div>
              
              <div className="nav-right">
                <div className="connection-status">
                  <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
                  <span>{isConnected ? 'API Online' : 'API Offline'}</span>
                </div>
                
                {user ? (
                  <UserNav />
                ) : (
                  <div className="auth-buttons">
                    <Link to="/login" className="btn btn-secondary">
                      Zaloguj się
                    </Link>
                    <Link to="/register" className="btn btn-primary">
                      Rejestracja
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Główna zawartość */}
      <Routes>
          <Route path="/" element={
            <section className="hero">
        <div className="hero-background">
          <div className="hero-particles"></div>
        </div>
        
        <div className="container">
          <div className="hero-content fade-in-up">
            <div className="logo-section">
              <h1 className="app-title">
                <span className="title-main">Next</span>
                <span className="title-accent">Reviews</span>
              </h1>
              <p className="app-subtitle">
                Nowoczesna aplikacja do zarządzania recenzjami
              </p>
            </div>

            {/* Status połączenia */}
            <div className="status-section">
              <div className="card status-card">
                <h3>Status połączenia z API</h3>
                
                {loading ? (
                  <div className="status-loading">
                    <div className="loading-spinner"></div>
                    <p>Sprawdzanie połączenia...</p>
                  </div>
                ) : isConnected ? (
                  <div className="status-online">
                    <div className="status-dot"></div>
                    <span>Połączono z backendem</span>
                  </div>
                ) : (
                  <div className="status-offline">
                    <div className="status-dot"></div>
                    <span>Brak połączenia z backendem</span>
                  </div>
                )}

                {error && (
                  <div className="error-message">
                    <p>{error}</p>
                    <button onClick={checkHealth} className="btn btn-secondary">
                      Spróbuj ponownie
                    </button>
                  </div>
                )}

                {healthData && (
                  <div className="health-data">
                    <h4>Dane z endpointu /health:</h4>
                    <div className="health-info">
                      <div className="health-item">
                        <strong>Status:</strong> 
                        <span className="status-badge success">{healthData.status}</span>
                      </div>
                      <div className="health-item">
                        <strong>Wiadomość:</strong> 
                        <span>{healthData.message}</span>
                      </div>
                      {healthData.timestamp && (
                        <div className="health-item">
                          <strong>Czas:</strong> 
                          <span>{new Date(healthData.timestamp).toLocaleString('pl-PL')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Call to Action */}
            <div className="cta-section">
              <p className="cta-text">
                Gotowy na nadchodzącą falę zmian w zarządzaniu recenzjami?
              </p>
              <div className="cta-buttons">
                <button 
                  onClick={checkHealth} 
                  className="btn pulse"
                  disabled={loading}
                >
                  {loading ? 'Sprawdzanie...' : 'Sprawdź połączenie'}
                </button>
                <button className="btn btn-secondary">
                  Dowiedz się więcej
                </button>
              </div>
            </div>
          </div>
            </div>
          </section>
          } />
          
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/clients" element={
            <ProtectedRoute>
              <ClientsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/qrcodes" element={
            <ProtectedRoute>
              <QRCodePage />
            </ProtectedRoute>
          } />
          
          <Route path="/client-login" element={<ClientLoginPage />} />
          <Route path="/review/:reviewCode" element={<ReviewFormPage />} />
      </Routes>
    </div>
  );
}

// Główny komponent App z Router
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
