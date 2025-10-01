import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { apiService } from './services/api';
import useAuth from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import UserNav from './components/UserNav';
import Dashboard from './components/Dashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ClientsPage from './pages/ClientsPage';
import SettingsPage from './pages/SettingsPage';
import ReviewFormPage from './pages/ReviewFormPage';
import QRCodePage from './pages/QRCodePage';
import ClientLoginPage from './pages/ClientLoginPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import logoImage from './assets/NEXT_reviews_BOOSTER_LOGO.jpg';
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
  const noNavRoutes = ['/client-login', '/review', '/dashboard'];
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
                <img src={logoImage} alt="NEXT reviews BOOSTER" className="logo-image" />
              </Link>
              
              <div className="nav-links">
                <Link to="/">Strona główna</Link>
                {user ? (
                  <Link to="/dashboard">Dashboard</Link>
                ) : (
                  <>
                    <a href="#cennik">Cennik</a>
                    <a href="#kontakt">Kontakt</a>
                  </>
                )}
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
            <div className="homepage">
              {/* Hero Section */}
              <section className="hero">
                <div className="hero-background">
                  <div className="hero-particles"></div>
                </div>
                
                <div className="container">
                  <div className="hero-content fade-in-up">
                    <div className="hero-text">
                      <h1 className="hero-title">
                        Automatyzuj zbieranie opinii i buduj reputację swojej firmy
                      </h1>
                      <p className="hero-subtitle">
                        NEXT reviews BOOSTER to innowacyjna platforma, która pomaga Twojej firmie automatycznie zbierać pozytywne recenzje od zadowolonych klientów, jednocześnie chroniąc Cię przed negatywnymi opiniami w internecie.
                      </p>
                      
                      <div className="hero-buttons">
                        <Link to="/register" className="btn btn-primary btn-large">
                          Rozpocznij za darmo
                        </Link>
                        <button className="btn btn-secondary btn-large">
                          Zobacz demo
                        </button>
                      </div>
                    </div>
                    
                    <div className="hero-visual">
                      <img src={logoImage} alt="NEXT reviews BOOSTER Logo" className="hero-logo" />
                    </div>
                  </div>
                </div>
              </section>

              {/* Features Section */}
              <section className="features">
                <div className="container">
                  <div className="section-header">
                    <h2>Jak działa NEXT reviews BOOSTER?</h2>
                    <p>Prosty proces, który automatycznie zwiększa liczbę pozytywnych opinii o Twojej firmie</p>
                  </div>
                  
                  <div className="features-grid">
                    <div className="feature-card">
                      <div className="feature-icon">📱</div>
                      <h3>Kody QR w Twoim lokalu</h3>
                      <p>Umieść kody QR w swoim salonie, sklepie lub biurze. Klienci skanują kod i przechodzą do formularza opinii.</p>
                    </div>
                    
                    <div className="feature-card">
                      <div className="feature-icon">🔍</div>
                      <h3>Inteligentne filtrowanie</h3>
                      <p>Pozytywne recenzje (4-5 gwiazdek) są automatycznie publikowane na Google. Negatywne trafiają tylko do Ciebie.</p>
                    </div>
                    
                    <div className="feature-card">
                      <div className="feature-icon">📊</div>
                      <h3>Zarządzanie bazą klientów</h3>
                      <p>Twórz i zarządzaj bazą swoich klientów. Śledź ich opinie i buduj długoterminowe relacje.</p>
                    </div>
                    
                    <div className="feature-card">
                      <div className="feature-icon">⚡</div>
                      <h3>Automatyzacja procesu</h3>
                      <p>Nie musisz już ręcznie prosić klientów o opinie. System robi to za Ciebie, oszczędzając Twój czas.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Benefits Section */}
              <section className="benefits">
                <div className="container">
                  <div className="benefits-content">
                    <div className="benefits-text">
                      <h2>Dlaczego NEXT reviews BOOSTER?</h2>
                      <div className="benefits-list">
                        <div className="benefit-item">
                          <div className="benefit-icon">⭐</div>
                          <div className="benefit-content">
                            <h4>Więcej pozytywnych opinii</h4>
                            <p>Zwiększ liczbę 5-gwiazdkowych recenzji na Google, co poprawia widoczność Twojej firmy w wynikach wyszukiwania.</p>
                          </div>
                        </div>
                        
                        <div className="benefit-item">
                          <div className="benefit-icon">🛡️</div>
                          <div className="benefit-content">
                            <h4>Ochrona przed negatywnymi opiniami</h4>
                            <p>Negatywne recenzje nie trafiają na Google, ale Ty otrzymujesz informację zwrotną, aby poprawić jakość usług.</p>
                          </div>
                        </div>
                        
                        <div className="benefit-item">
                          <div className="benefit-icon">⏰</div>
                          <div className="benefit-content">
                            <h4>Oszczędność czasu</h4>
                            <p>Nie musisz już pamiętać o proszeniu klientów o opinie. System robi to automatycznie za Ciebie.</p>
                          </div>
                        </div>
                        
                        <div className="benefit-item">
                          <div className="benefit-icon">📈</div>
                          <div className="benefit-content">
                            <h4>Wzrost zaufania klientów</h4>
                            <p>Wysoka ocena na Google buduje zaufanie potencjalnych klientów i zwiększa konwersję.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="benefits-visual">
                      <div className="stats-card">
                        <h3>Statystyki</h3>
                        <div className="stat-item">
                          <div className="stat-number">+85%</div>
                          <div className="stat-label">Więcej pozytywnych opinii</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-number">-90%</div>
                          <div className="stat-label">Negatywnych opinii na Google</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-number">3x</div>
                          <div className="stat-label">Szybszy wzrost reputacji</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Google Reviews Benefits Section */}
              <section className="google-benefits">
                <div className="container">
                  <div className="section-header">
                    <h2>Dlaczego opinie Google są kluczowe dla Twojej firmy?</h2>
                    <p>Odkryj jak pozytywne recenzje na Google mogą przekształcić Twoją firmę</p>
                  </div>
                  
                  <div className="google-benefits-grid">
                    <div className="benefit-card">
                      <div className="benefit-icon">🔍</div>
                      <h3>Widoczność w wyszukiwarkach</h3>
                      <p>Firmy z wyższymi ocenami Google pojawiają się wyżej w wynikach wyszukiwania. Każda dodatkowa gwiazdka to więcej klientów, którzy Cię znajdą.</p>
                      <div className="benefit-stat">+67% więcej ruchu z Google</div>
                    </div>
                    
                    <div className="benefit-card">
                      <div className="benefit-icon">💰</div>
                      <h3>Zwiększona sprzedaż</h3>
                      <p>Klienci ufają opiniom innych klientów. Każda pozytywna recenzja to potencjalny nowy klient, który wybierze Cię zamiast konkurencji.</p>
                      <div className="benefit-stat">+31% wzrost konwersji</div>
                    </div>
                    
                    <div className="benefit-card">
                      <div className="benefit-icon">🏆</div>
                      <h3>Przewaga nad konkurencją</h3>
                      <p>Wysokie oceny Google to Twój najsilniejszy argument w walce o klientów. Pokazujesz, że jesteś lepszy od konkurencji.</p>
                      <div className="benefit-stat">+45% więcej zapytań</div>
                    </div>
                    
                    <div className="benefit-card">
                      <div className="benefit-icon">📱</div>
                      <h3>Zaufanie mobilnych użytkowników</h3>
                      <p>90% klientów czyta opinie przed wizytą. Na telefonie opinie Google są pierwszym, co widzą potencjalni klienci.</p>
                      <div className="benefit-stat">90% klientów czyta opinie</div>
                    </div>
                    
                    <div className="benefit-card">
                      <div className="benefit-icon">🎯</div>
                      <h3>Lepsze pozycjonowanie lokalne</h3>
                      <p>Google faworyzuje firmy z dobrymi opiniami w wyszukiwaniach lokalnych. "Salon fryzjerski w Warszawie" - Twoja firma będzie na górze.</p>
                      <div className="benefit-stat">+78% więcej lokalnych klientów</div>
                    </div>
                    
                    <div className="benefit-card">
                      <div className="benefit-icon">🔄</div>
                      <h3>Długoterminowy wzrost</h3>
                      <p>Pozytywne opinie to inwestycja w przyszłość. Każda recenzja buduje Twoją reputację na lata, przyciągając nowych klientów.</p>
                      <div className="benefit-stat">+156% wzrost w ciągu roku</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Platform Benefits Section */}
              <section className="platform-benefits">
                <div className="container">
                  <div className="section-header">
                    <h2>Co otrzymasz z NEXT reviews BOOSTER?</h2>
                    <p>Kompletne rozwiązanie do zarządzania reputacją Twojej firmy</p>
                  </div>
                  
                  <div className="platform-benefits-content">
                    <div className="benefits-column">
                      <div className="benefit-item-large">
                        <div className="benefit-icon-large">🚀</div>
                        <div className="benefit-content-large">
                          <h3>Automatyzacja zbierania opinii</h3>
                          <p>Nie musisz już pamiętać o proszeniu klientów o opinie. System automatycznie wysyła SMS-y z przypomnieniami, zwiększając liczbę recenzji o 300%.</p>
                          <ul className="benefit-features">
                            <li>✅ Automatyczne SMS-y z linkami do opinii</li>
                            <li>✅ Inteligentne przypomnienia co 1-30 dni</li>
                            <li>✅ Personalizowane wiadomości dla każdego klienta</li>
                            <li>✅ Integracja z Twilio - profesjonalne SMS-y</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="benefit-item-large">
                        <div className="benefit-icon-large">🛡️</div>
                        <div className="benefit-content-large">
                          <h3>Ochrona przed negatywnymi opiniami</h3>
                          <p>Negatywne recenzje nie trafiają na Google, ale Ty otrzymujesz cenną informację zwrotną, aby poprawić jakość usług i zadowolić klientów.</p>
                          <ul className="benefit-features">
                            <li>✅ Filtrowanie negatywnych opinii (1-3 gwiazdki)</li>
                            <li>✅ Prywatne powiadomienia o problemach</li>
                            <li>✅ Możliwość kontaktu z niezadowolonymi klientami</li>
                            <li>✅ Ochrona reputacji online</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="benefits-column">
                      <div className="benefit-item-large">
                        <div className="benefit-icon-large">📊</div>
                        <div className="benefit-content-large">
                          <h3>Profesjonalne zarządzanie klientami</h3>
                          <p>Zarządzaj bazą klientów, śledź ich opinie i buduj długoterminowe relacje. Każdy klient to potencjalna pozytywna recenzja.</p>
                          <ul className="benefit-features">
                            <li>✅ Kompletna baza danych klientów</li>
                            <li>✅ Historia wszystkich opinii i interakcji</li>
                            <li>✅ Status każdej recenzji (wysłana/otwarta/ukończona)</li>
                            <li>✅ Notatki i dodatkowe informacje o klientach</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="benefit-item-large">
                        <div className="benefit-icon-large">🔗</div>
                        <div className="benefit-content-large">
                          <h3>Kody QR i integracja z Google</h3>
                          <p>Profesjonalne kody QR prowadzą klientów bezpośrednio do formularza opinii, a pozytywne recenzje automatycznie trafiają na Google.</p>
                          <ul className="benefit-features">
                            <li>✅ Kody QR do druku w salonie/sklepie</li>
                            <li>✅ Automatyczne przekierowanie na Google dla 5 gwiazdek</li>
                            <li>✅ Personalizowane linki dla każdego klienta</li>
                            <li>✅ Łatwa integracja z wizytówką Google</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ROI Section */}
              <section className="roi-section">
                <div className="container">
                  <div className="roi-content">
                    <div className="roi-text">
                      <h2>Zwrot z inwestycji już w pierwszym miesiącu</h2>
                      <p>NEXT reviews BOOSTER to nie koszt, to inwestycja, która się zwraca. Oto jak Twoja firma skorzysta:</p>
                      
                      <div className="roi-stats">
                        <div className="roi-stat">
                          <div className="roi-number">+300%</div>
                          <div className="roi-label">Więcej pozytywnych opinii</div>
                        </div>
                        <div className="roi-stat">
                          <div className="roi-number">+67%</div>
                          <div className="roi-label">Więcej ruchu z Google</div>
                        </div>
                        <div className="roi-stat">
                          <div className="roi-number">+31%</div>
                          <div className="roi-label">Wzrost konwersji</div>
                        </div>
                        <div className="roi-stat">
                          <div className="roi-number">-90%</div>
                          <div className="roi-label">Negatywnych opinii na Google</div>
                        </div>
                      </div>
                      
                      <div className="roi-example">
                        <h4>Przykład: Salon fryzjerski</h4>
                        <p>Koszt platformy: 99 zł/miesiąc</p>
                        <p>Dodatkowi klienci dzięki lepszym opiniom: 15/miesiąc</p>
                        <p>Średnia wartość klienta: 80 zł</p>
                        <p><strong>Dodatkowy przychód: 1,200 zł/miesiąc</strong></p>
                        <p><strong>ROI: 1,200% w pierwszym miesiącu!</strong></p>
                      </div>
                    </div>
                    
                    <div className="roi-visual">
                      <div className="roi-chart">
                        <div className="chart-bar" style={{height: '100%'}}>
                          <div className="bar-label">Z NEXT reviews BOOSTER</div>
                          <div className="bar-value">1,200 zł</div>
                        </div>
                        <div className="chart-bar" style={{height: '30%'}}>
                          <div className="bar-label">Bez platformy</div>
                          <div className="bar-value">360 zł</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* CTA Section */}
              <section className="cta-section">
                <div className="container">
                  <div className="cta-content">
                    <h2>Gotowy na zwiększenie liczby pozytywnych opinii?</h2>
                    <p>Dołącz do firm, które już używają NEXT reviews BOOSTER do budowania swojej reputacji online</p>
                    <div className="cta-buttons">
                      <Link to="/register" className="btn btn-primary btn-large">
                        Rozpocznij za darmo
                      </Link>
                      <Link to="/login" className="btn btn-secondary btn-large">
                        Zaloguj się
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

              {/* Pricing Section */}
              <section id="cennik" className="pricing">
                <div className="container">
                  <div className="section-header">
                    <h2>Prosty i przejrzysty cennik</h2>
                    <p>Wybierz plan, który najlepiej odpowiada potrzebom Twojej firmy</p>
                  </div>
                  
                  <div className="pricing-grid">
                    <div className="pricing-card">
                      <div className="pricing-header">
                        <h3>Starter</h3>
                        <div className="price">
                          <span className="currency">zł</span>
                          <span className="amount">0</span>
                          <span className="period">/miesiąc</span>
                        </div>
                      </div>
                      <div className="pricing-features">
                        <ul>
                          <li>✅ Do 50 recenzji miesięcznie</li>
                          <li>✅ Kody QR dla firmy</li>
                          <li>✅ Podstawowe filtrowanie</li>
                          <li>✅ Baza klientów (do 100)</li>
                          <li>❌ Wsparcie email</li>
                        </ul>
                      </div>
                      <div className="pricing-cta">
                        <Link to="/register" className="btn btn-secondary">
                          Rozpocznij za darmo
                        </Link>
                      </div>
                    </div>
                    
                    <div className="pricing-card featured">
                      <div className="popular-badge">Najpopularniejszy</div>
                      <div className="pricing-header">
                        <h3>Professional</h3>
                        <div className="price">
                          <span className="currency">zł</span>
                          <span className="amount">99</span>
                          <span className="period">/miesiąc</span>
                        </div>
                      </div>
                      <div className="pricing-features">
                        <ul>
                          <li>✅ Nielimitowane recenzje</li>
                          <li>✅ Kody QR dla firmy</li>
                          <li>✅ Zaawansowane filtrowanie</li>
                          <li>✅ Nielimitowana baza klientów</li>
                          <li>✅ Wsparcie email i telefon</li>
                          <li>✅ Analityka i raporty</li>
                        </ul>
                      </div>
                      <div className="pricing-cta">
                        <Link to="/register" className="btn btn-primary">
                          Wybierz plan
                        </Link>
                      </div>
                    </div>
                    
                    <div className="pricing-card">
                      <div className="pricing-header">
                        <h3>Enterprise</h3>
                        <div className="price">
                          <span className="currency">zł</span>
                          <span className="amount">299</span>
                          <span className="period">/miesiąc</span>
                        </div>
                      </div>
                      <div className="pricing-features">
                        <ul>
                          <li>✅ Wszystko z Professional</li>
                          <li>✅ Integracje z systemami</li>
                          <li>✅ Własne logo na kodach QR</li>
                          <li>✅ Wsparcie priorytetowe</li>
                          <li>✅ Szkolenia dla zespołu</li>
                          <li>✅ API dostęp</li>
                        </ul>
                      </div>
                      <div className="pricing-cta">
                        <Link to="/register" className="btn btn-secondary">
                          Skontaktuj się
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact Section */}
              <section id="kontakt" className="contact">
                <div className="container">
                  <div className="contact-content">
                    <div className="contact-info">
                      <h2>Skontaktuj się z nami</h2>
                      <p>Masz pytania? Chcesz dowiedzieć się więcej o NEXT reviews BOOSTER? Jesteśmy tutaj, aby pomóc!</p>
                      
                      <div className="contact-methods">
                        <div className="contact-method">
                          <div className="contact-icon">📧</div>
                          <div className="contact-details">
                            <h4>Email</h4>
                            <p>kontakt@next-reviews-booster.com</p>
                          </div>
                        </div>
                        
                        <div className="contact-method">
                          <div className="contact-icon">📱</div>
                          <div className="contact-details">
                            <h4>Telefon</h4>
                            <p>+48 730 004 440</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="contact-form">
                      <h3>Wyślij wiadomość</h3>
                      <form>
                        <div className="form-group">
                          <input type="text" placeholder="Imię i nazwisko" required />
                        </div>
                        <div className="form-group">
                          <input type="email" placeholder="Email" required />
                        </div>
                        <div className="form-group">
                          <input type="text" placeholder="Firma (opcjonalnie)" />
                        </div>
                        <div className="form-group">
                          <textarea placeholder="Twoja wiadomość" rows="5" required></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary">
                          Wyślij wiadomość
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </section>

              {/* Footer */}
              <footer className="footer">
                <div className="container">
                  <div className="footer-content">
                    <div className="footer-links">
                      <a href="#cennik">Cennik</a>
                      <a href="#kontakt">Kontakt</a>
                      <a href="/login">Logowanie</a>
                      <a href="/register">Rejestracja</a>
                    </div>
                    <div className="footer-copyright">
                      © 2025 Created by <a href="https://nextmarketingstudio.com/">NEXT marketing STUDIO</a> | <a href="/polityka-prywatnosci">Polityka prywatności</a> | <a href="/regulamin">Regulamin</a>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          } />
          
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Navigate to="/dashboard/statistics" replace />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/*" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Public Routes */}
          <Route path="/client-login/:username" element={<ClientLoginPage />} />
          <Route path="/review/:reviewCode" element={<ReviewFormPage />} />
          <Route path="/polityka-prywatnosci" element={<PrivacyPolicyPage />} />
          <Route path="/regulamin" element={<TermsPage />} />
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
