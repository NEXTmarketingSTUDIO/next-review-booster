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
import './styles/mobile.css';

// Komponent wewnętrzny z dostępem do useLocation
function AppContent() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Stan formularza kontaktowego
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [contactFormLoading, setContactFormLoading] = useState(false);
  const [contactFormMessage, setContactFormMessage] = useState('');
  
  // Hook autoryzacji Firebase
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  // Strony bez nawigacji
  const noNavRoutes = ['/client-login', '/review', '/dashboard'];
  const shouldShowNav = !noNavRoutes.some(route => location.pathname.startsWith(route));
  

  useEffect(() => {
    checkHealth();
    
    // Sprawdzaj status co 5 minut (zoptymalizowane)
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    
    // Inicjalizuj Feather Icons
    if (window.feather) {
      window.feather.replace();
    }
    
    return () => clearInterval(interval);
  }, []);

  // Obsługa zmiany rozmiaru okna
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Inicjalizuj Feather Icons po każdej zmianie
  useEffect(() => {
    if (window.feather) {
      window.feather.replace();
    }
  });

  // Inicjalizuj wykres Chart.js
  useEffect(() => {
    if (window.Chart) {
      const ctx = document.getElementById('roiChart');
      if (ctx) {
        // Zniszcz poprzedni wykres jeśli istnieje
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
          existingChart.destroy();
        }

        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Bez NEXT reviews BOOSTER', 'Z NEXT reviews BOOSTER'],
            datasets: [{
              label: 'Przychód (zł)',
              data: [199, 960],
              backgroundColor: [
                'rgba(239, 68, 68, 0.8)',
                'rgba(16, 185, 129, 0.8)'
              ],
              borderColor: [
                'rgba(239, 68, 68, 1)',
                'rgba(16, 185, 129, 1)'
              ],
              borderWidth: 2,
              borderRadius: 8,
              borderSkipped: false,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(245, 158, 11, 0.5)',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                  title: function(context) {
                    return context[0].label;
                  },
                  label: function(context) {
                    return context.parsed.y + ' zł';
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 1000,
                ticks: {
                  color: '#6b7280',
                  font: {
                    size: 12,
                    family: 'Inter, sans-serif'
                  },
                  callback: function(value) {
                    return value + ' zł';
                  }
                },
                grid: {
                  color: 'rgba(107, 114, 128, 0.1)',
                  drawBorder: false
                }
              },
              x: {
                ticks: {
                  color: '#6b7280',
                  font: {
                    size: 12,
                    family: 'Inter, sans-serif'
                  },
                  maxRotation: 0,
                  minRotation: 0
                },
                grid: {
                  display: false
                }
              }
            },
            animation: {
              duration: 1500,
              easing: 'easeInOutQuart'
            }
          }
        });
      }
    }
  }, []);


  // Obsługa scroll z histerezą - zapobiega migotaniu
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Histereza: różne progi dla przewijania w górę i w dół
          const scrollDownThreshold = 10;  // Próg dla przewijania w dół
          const scrollUpThreshold = 50;     // Próg dla przewijania w górę (niższy)
          
          setIsScrolled(prevScrolled => {
            if (!prevScrolled && currentScrollY > scrollDownThreshold) {
              return true;  // Przewijanie w dół - aktywuj scrolled
            } else if (prevScrolled && currentScrollY < scrollUpThreshold) {
              return false; // Przewijanie w górę - dezaktywuj scrolled
            }
            return prevScrolled; // Bez zmian
          });
          
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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

  // Obsługa formularza kontaktowego
  const handleContactFormChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactFormSubmit = async (e) => {
    e.preventDefault();
    
    // Walidacja
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      setContactFormMessage('Proszę wypełnić wszystkie wymagane pola');
      return;
    }

    // Walidacja email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactForm.email)) {
      setContactFormMessage('Proszę podać prawidłowy adres email');
      return;
    }

    try {
      setContactFormLoading(true);
      setContactFormMessage('');
      
      const result = await apiService.submitContactForm({
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        company: contactForm.company.trim(),
        message: contactForm.message.trim()
      });
      
      setContactFormMessage(result.message);
      
      // Wyczyść formularz po udanym wysłaniu
      setContactForm({
        name: '',
        email: '',
        company: '',
        message: ''
      });
      
    } catch (error) {
      console.error('❌ Błąd wysyłania formularza kontaktowego:', error);
      setContactFormMessage('Wystąpił błąd podczas wysyłania wiadomości. Spróbuj ponownie.');
    } finally {
      setContactFormLoading(false);
    }
  };

  return (
    <div className="App">
      {/* Mobile menu overlay */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Nawigacja - tylko dla stron z nawigacją */}
      {shouldShowNav && (
        <nav className={`navigation ${isScrolled ? 'scrolled' : ''}`}>
          <div className="container">
            <div className="nav-content">
              <Link to="/" className="logo">
                <img src={logoImage} alt="NEXT reviews BOOSTER" className="logo-image" />
              </Link>
              
              {/* Burger menu button for mobile */}
              {isMobile && (
                <button 
                  className="mobile-menu-toggle"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle Menu"
                >
                  <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </button>
              )}
              
              <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="nav-link">
                  Strona główna
                </Link>
                <a href="#cennik" onClick={() => setIsMobileMenuOpen(false)} className="nav-link">
                  Cennik
                </a>
                <a href="#kontakt" onClick={() => setIsMobileMenuOpen(false)} className="nav-link">
                  Kontakt
                </a>
              </div>
              
              <div className={`nav-right ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                
                {user ? (
                  <UserNav />
                ) : (
                  <div className="auth-buttons">
                    <Link to="/login" className="btn btn-secondary" onClick={() => setIsMobileMenuOpen(false)}>
                      Zaloguj się
                    </Link>
                    <Link to="/register" className="btn btn-primary" onClick={() => setIsMobileMenuOpen(false)}>
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
                      Zrób z opinii silnik sprzedaży, bo 5⭐/5⭐ = więcej klientów.
                      </h1>
                      <p className="hero-subtitle"><b>Automatycznie zbieraj pozytywne recenzje, reaguj na negatywne i buduj reputację, która sprzedaje.</b></p>


                      <p className="hero-subtitle">
                      <b>NEXT reviews BOOSTER to platforma,</b> która robi za Ciebie <b>całą robotę z opiniami.</b> Wyobraź sobie asystenta, który <b>automatycznie zbiera pozytywne recenzje</b> od zadowolonych klientów, analizuje feedback i <b>ostrzega Cię o problemach</b> – zanim staną się kryzysem. <b>Zyskujesz</b> nie tylko więcej ocen 5⭐, ale też <b>czas i przestrzeń</b>, by spokojnie reagować na <b>trudne opinie</b>. Dzięki temu możesz <b>ulepszać procesy w firmie,</b> <b>zwiększać satysfakcję klientów</b> i zapobiegać powtarzającym się błędom.
                      </p>
                      
                      <div className="hero-buttons">
                        <Link to="/register" className="btn btn-primary btn-large heartbeat">
                          Zacznij darmowy okres próbny
                        </Link>
                      </div>
                      <p className="hero-subtitle">Przekonaj się, jak łatwo można zapanować nad opiniami online — zanim one zapanują nad Tobą.</p>
                    </div>
                    
                    <div className="hero-visual">
                      <img src={logoImage} alt="NEXT reviews BOOSTER Logo" className="hero-logo" />
                    </div>
                  </div>
                </div>
              </section>

              {/* Reputation Advantage Section */}
              <section className="reputation-advantage">
                <div className="container">
                  <div className="advantage-content">
                    <div className="advantage-text">
                      <h2>Dziś nie wygrywają najtańsi, <br /> tylko ci z najlepszą reputacją.</h2>
                      <p className="advantage-subtitle">5.0 to Twoja przewaga.</p>
                      
                      <div className="advantage-stats">
                        <div className="advantage-stat">
                          <div className="stat-icon">
                            <i data-feather="award"></i>
                          </div>
                          <div className="stat-content">
                            <div className="stat-number">5.0</div>
                            <div className="stat-label">Średnia ocena</div>
                            <div className="stat-description">Twoja przewaga nad konkurencją</div>
                          </div>
                  </div>
                  
                        <div className="advantage-stat">
                          <div className="stat-icon">
                            <i data-feather="trending-up"></i>
                          </div>
                          <div className="stat-content">
                            <div className="stat-number">+127%</div>
                            <div className="stat-label">Więcej klientów</div>
                            <div className="stat-description">Firmy z 5.0 mają więcej zapytań</div>
                          </div>
                    </div>
                    
                        <div className="advantage-stat">
                          <div className="stat-icon">
                            <i data-feather="dollar-sign"></i>
                          </div>
                          <div className="stat-content">
                            <div className="stat-number">+45%</div>
                            <div className="stat-label">Wyższe ceny</div>
                            <div className="stat-description">Możesz żądać więcej za usługi</div>
                          </div>
                        </div>
                    </div>
                    
                      <div className="advantage-proof">
                        <h3>Dlaczego reputacja to wszystko?</h3>
                        <div className="proof-points">
                          <div className="proof-point">
                            <div className="proof-icon">
                              <i data-feather="search"></i>
                            </div>
                            <div className="proof-text">
                              <h4>Google faworyzuje 5.0</h4>
                              <p>Firmy z wyższymi ocenami pojawiają się wyżej w wynikach wyszukiwania</p>
                            </div>
                          </div>
                          <div className="proof-point">
                            <div className="proof-icon">
                              <i data-feather="search"></i>
                            </div>
                            <div className="proof-text">
                              <h4>Klienci wybierają 5.0</h4>
                              <p>93% klientów czyta opinie przed wyborem usługodawcy</p>
                            </div>
                          </div>
                          <div className="proof-point">
                            <div className="proof-icon">
                              <i data-feather="search"></i>
                            </div>
                            <div className="proof-text">
                              <h4>Ochrona przed kryzysem</h4>
                              <p>Jedna negatywna opinia może zniszczyć miesiące budowania reputacji</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                        
                    <div className="advantage-visual">
                      <div className="rating-comparison">
                        <div className="comparison-header">
                          <h3>Twoja konkurencja vs Ty</h3>
                          </div>
                        
                        <div className="competitor-rating">
                          <div className="rating-label">Konkurencja</div>
                          <div className="rating-stars">
                            <span className="star filled">★</span>
                            <span className="star filled">★</span>
                            <span className="star filled">★</span>
                            <span className="star filled">★</span>
                            <span className="star empty">☆</span>
                          </div>
                          <div className="rating-number">4.2</div>
                          <div className="rating-description">Średnia ocena</div>
                        </div>
                        
                        <div className="vs-divider">
                          <span>VS</span>
                          </div>
                        
                        <div className="your-rating">
                          <div className="rating-label">Ty z NEXT reviews BOOSTER</div>
                          <div className="rating-stars">
                            <span className="star filled">★</span>
                            <span className="star filled">★</span>
                            <span className="star filled">★</span>
                            <span className="star filled">★</span>
                            <span className="star filled">★</span>
                          </div>
                          <div className="rating-number">5.0</div>
                          <div className="rating-description">Średnia ocena</div>
                        </div>
                        
                        <div className="advantage-result">
                          <div className="result-text">Twoja przewaga: <strong>+19% więcej klientów</strong></div>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
              </section>

              {/* Decision Factor Section */}
              <section className="decision-factor">
                <div className="container">
                  <div className="decision-content">
                    <div className="decision-header">
                      <h2>Gdy każdy produkt/usługa <strong>wygląda podobnie</strong>, <br />pięć gwiazdek staje się <strong>jedynym kryterium wyboru.</strong></h2>
                    </div>
                    
                    <div className="decision-grid">
                      <div className="decision-card">
                        <div className="card-visual">
                          <div className="product-comparison">
                            <div className="product-item">
                              <div className="product-image">
                                <div className="product-placeholder">
                                  <i data-feather="package"></i>
                                </div>
                              </div>
                              <div className="product-info">
                                <h4>Salon A</h4>
                                <div className="product-rating">
                                  <span className="stars">★★★★☆</span>
                                  <span className="rating-number">4.2</span>
                                </div>
                                <div className="product-price">150 zł</div>
                              </div>
                            </div>
                            
                            <div className="vs-divider">
                              <span>VS</span>
                            </div>
                            
                            <div className="product-item winner">
                              <div className="product-image">
                                <div className="product-placeholder">
                                  <i data-feather="package"></i>
                                </div>
                                <div className="winner-badge">
                                  <i data-feather="award"></i>
                                </div>
                              </div>
                              <div className="product-info">
                                <h4>Salon B</h4>
                                <div className="product-rating">
                                  <span className="stars">★★★★★</span>
                                  <span className="rating-number">5.0</span>
                                </div>
                                <div className="product-price">180 zł</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="card-content">
                          <h3>Klient wybiera droższy salon</h3>
                          <p>Pomimo wyższej ceny o 30 zł, klient wybiera salon z 5.0, bo <strong>ufa opinii innych klientów</strong> bardziej niż własnym osądom.</p>
                        </div>
                      </div>
                      
                      <div className="decision-stats">
                        <div className="stat-item">
                          <div className="stat-icon">
                            <i data-feather="users"></i>
                        </div>
                          <div className="stat-content">
                            <div className="stat-number">87%</div>
                            <div className="stat-label">Klientów wybiera 5.0</div>
                            <div className="stat-description">Nawet jeśli cena jest wyższa</div>
                          </div>
                        </div>
                        
                        <div className="stat-item">
                          <div className="stat-icon">
                            <i data-feather="dollar-sign"></i>
                        </div>
                          <div className="stat-content">
                            <div className="stat-number">+23%</div>
                            <div className="stat-label">Wyższe ceny</div>
                            <div className="stat-description">Możesz żądać więcej za 5.0</div>
                          </div>
                        </div>
                        
                        <div className="stat-item">
                          <div className="stat-icon">
                            <i data-feather="trending-up"></i>
                          </div>
                          <div className="stat-content">
                            <div className="stat-number">+156%</div>
                            <div className="stat-label">Więcej zapytań</div>
                            <div className="stat-description">5.0 przyciąga więcej klientów</div>
                          </div>
                        </div>
                      </div>
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
                  
                  <div className="features-grid-6">
                    <div className="feature-card">
                      <div className="feature-icon">
                        <i data-feather="message-circle"></i>
                      </div>
                      <h3>Automatyczne SMS-y</h3>
                      <p>System sam wysyła SMS-y do klientów z prośbą o opinię. <strong>Nie musisz o niczym pamiętać</strong> - wszystko dzieje się automatycznie! Sam ustalasz częstotliwość wysyłki SMS</p>
                    </div>
                    
                    <div className="feature-card">
                      <div className="feature-icon">
                        <i data-feather="smartphone"></i>
                      </div>
                      <h3>Kody QR w lokalu</h3>
                      <p>Umieść kody QR w salonie, sklepie lub biurze. Klienci skanują i <strong>od razu mogą zostawić opinię</strong> - bez komplikacji!</p>
                    </div>
                    
                    <div className="feature-card">
                      <div className="feature-icon">
                        <i data-feather="shield"></i>
                      </div>
                      <h3>Inteligentne filtrowanie</h3>
                      <p>Dobre opinie idą w świat, trudne zostają z Tobą. Masz szansę zareagować i naprawić sytuację, zanim zobaczą ją inni.</p>
                    </div>
                    
                    <div className="feature-card">
                      <div className="feature-icon">
                        <i data-feather="users"></i>
                      </div>
                      <h3>Baza klientów</h3>
                      <p>Zarządzaj wszystkimi klientami w jednym miejscu. <strong>Śledź ich opinie, buduj relacje</strong> i zwiększaj lojalność!</p>
                    </div>
                    
                    <div className="feature-card">
                      <div className="feature-icon">
                        <i data-feather="trending-up"></i>
                      </div>
                      <h3>Wzrost sprzedaży</h3>
                      <p>Więcej pozytywnych opinii = <strong>więcej zaufania klientów</strong> = więcej sprzedaży. <strong>Proste jak drut!</strong></p>
                    </div>
                    
                    <div className="feature-card">
                      <div className="feature-icon">
                        <i data-feather="clock"></i>
                      </div>
                      <h3>Oszczędność czasu</h3>
                      <p>Nie musisz już ręcznie prosić o opinie. <strong>System robi to za Ciebie 24/7</strong> - oszczędzasz mnóstwo czasu i nerwów!</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Dashboard Stats Section */}
              <section className="dashboard-stats">
                <div className="container">
                  <div className="stats-header">
                    <p>W świecie, gdzie <strong>decyzje podejmuje się w 5 sekund</strong>,<br /> pięć gwiazdek może dać Ci <strong>5 razy więcej klientów.</strong></p>
                  </div>
                  
                  <div className="dashboard-container">
                    {/* Summary Cards */}
                    <div className="summary-section">
                      <h3>Podsumowanie efektów</h3>
                      <div className="summary-cards">
                        <div className="summary-card orange">
                          <div className="card-icon">
                            <i data-feather="smartphone"></i>
                          </div>
                          <div className="card-content">
                            <div className="card-number">+85%</div>
                            <div className="card-label">Pozytywnych opinii</div>
                            <div className="card-description">łącznie</div>
                          </div>
                        </div>
                        
                        <div className="summary-card orange">
                          <div className="card-icon">
                            <i data-feather="shield"></i>
                          </div>
                          <div className="card-content">
                            <div className="card-number">-90%</div>
                            <div className="card-label">Negatywnych opinii</div>
                            <div className="card-description">na Google</div>
                          </div>
                        </div>
                        
                        <div className="summary-card orange">
                          <div className="card-icon">
                            <i data-feather="trending-up"></i>
                          </div>
                          <div className="card-content">
                            <div className="card-number">3x</div>
                            <div className="card-label">Szybszy wzrost</div>
                            <div className="card-description">reputacji</div>
                          </div>
                        </div>
                        
                        <div className="summary-card orange">
                          <div className="card-icon">
                            <i data-feather="users"></i>
                          </div>
                          <div className="card-content">
                            <div className="card-number">+67%</div>
                            <div className="card-label">Więcej ruchu</div>
                            <div className="card-description">z Google</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Ranking Section */}
                    <div className="ranking-section">
                      <h3>Najlepsze wyniki naszych klientów</h3>
                      <div className="ranking-list">
                        <div className="ranking-item">
                          <div className="rank-number">1</div>
                          <div className="rank-content">
                            <div className="rank-title">Salon Fryzjerski "Elegant"</div>
                            <div className="rank-stats">
                              <span className="stat">+127% więcej opinii</span>
                              <span className="stat">-95% negatywnych</span>
                            </div>
                          </div>
                          <div className="rank-rating">
                            <div className="rating-number">4.9</div>
                            <div className="rating-stars">★★★★★</div>
                            <div className="rating-label">średnia</div>
                          </div>
                        </div>
                        
                        <div className="ranking-item">
                          <div className="rank-number">2</div>
                          <div className="rank-content">
                            <div className="rank-title">Restauracja "Bella Vista"</div>
                            <div className="rank-stats">
                              <span className="stat">+98% więcej opinii</span>
                              <span className="stat">-88% negatywnych</span>
                            </div>
                          </div>
                          <div className="rank-rating">
                            <div className="rating-number">4.8</div>
                            <div className="rating-stars">★★★★★</div>
                            <div className="rating-label">średnia</div>
                          </div>
                        </div>
                        
                        <div className="ranking-item">
                          <div className="rank-number">3</div>
                          <div className="rank-content">
                            <div className="rank-title">Gabinet Kosmetyczny "Glow"</div>
                            <div className="rank-stats">
                              <span className="stat">+85% więcej opinii</span>
                              <span className="stat">-90% negatywnych</span>
                            </div>
                          </div>
                          <div className="rank-rating">
                            <div className="rating-number">4.9</div>
                            <div className="rating-stars">★★★★★</div>
                            <div className="rating-label">średnia</div>
                          </div>
                        </div>
                      </div>
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
                        <div className="benefit-icon-large">
                          <i data-feather="zap"></i>
                        </div>
                        <div className="benefit-content-large">
                          <h3>Automatyzacja zbierania opinii</h3>
                          <p>Nie musisz już pamiętać o proszeniu klientów o opinie. System automatycznie wysyła SMS-y z przypomnieniami, zwiększając liczbę recenzji o 300%.</p>
                          <ul className="benefit-features">
                            <li>⭐ Automatyczne SMS-y z linkami do opinii</li>
                            <li>⭐ Inteligentne przypomnienia co 1-30 dni</li>
                            <li>⭐ Personalizowane wiadomości dla każdego klienta</li>
                            <li>⭐ Integracja z Twilio - profesjonalne SMS-y</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="benefit-item-large">
                        <div className="benefit-icon-large">
                          <i data-feather="shield"></i>
                        </div>
                        <div className="benefit-content-large">
                          <h3>Ochrona przed negatywnymi opiniami</h3>
                          <p>Negatywne recenzje nie trafiają na Google, ale Ty otrzymujesz cenną informację zwrotną, aby poprawić jakość usług i zadowolić klientów.</p>
                          <ul className="benefit-features">
                            <li>⭐ Filtrowanie negatywnych opinii (1-4 gwiazdki)</li>
                            <li>⭐ Prywatne powiadomienia o problemach</li>
                            <li>⭐ Możliwość kontaktu z niezadowolonymi klientami</li>
                            <li>⭐ Ochrona reputacji online</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="benefits-column">
                      <div className="benefit-item-large">
                        <div className="benefit-icon-large">
                          <i data-feather="bar-chart-2"></i>
                        </div>
                        <div className="benefit-content-large">
                          <h3>Profesjonalne zarządzanie klientami</h3>
                          <p>Zarządzaj bazą klientów, śledź ich opinie i buduj długoterminowe relacje. Każdy klient to potencjalna pozytywna recenzja.</p>
                          <ul className="benefit-features">
                            <li>⭐ Kompletna baza danych klientów</li>
                            <li>⭐ Historia wszystkich opinii i interakcji</li>
                            <li>⭐ Status każdej recenzji (wysłana/otwarta/ukończona)</li>
                            <li>⭐ Notatki i dodatkowe informacje o klientach</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="benefit-item-large">
                        <div className="benefit-icon-large">
                          <i data-feather="link"></i>
                        </div>
                        <div className="benefit-content-large">
                          <h3>Kody QR i integracja z Google</h3>
                          <p>Profesjonalne kody QR prowadzą klientów bezpośrednio do formularza opinii, a pozytywne recenzje automatycznie trafiają na Google.</p>
                          <ul className="benefit-features">
                            <li>⭐ Kody QR do druku w salonie/sklepie</li>
                            <li>⭐ Automatyczne przekierowanie na Google dla 5 gwiazdek</li>
                            <li>⭐ Personalizowane linki dla każdego klienta</li>
                            <li>⭐ Łatwa integracja z wizytówką Google</li>
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
                        <p>Koszt platformy: 199 zł/miesiąc</p>
                        <p>Dodatkowi klienci dzięki lepszym opiniom: 12/miesiąc</p>
                        <p>Średnia wartość klienta: 80 zł</p>
                        <p><strong>Dodatkowy przychód: 960 zł/miesiąc</strong></p>
                        <p><strong>ROI: 383% w pierwszym miesiącu!</strong></p>
                      </div>
                    </div>
                    
                    <div className="roi-visual">
                      <div className="roi-chart">
                        <div className="chart-header">
                          <h3>Twój przychód: PRZED vs PO</h3>
                          <p>Rzeczywiste wyniki w pierwszym miesiącu</p>
                        </div>
                        
                        <div className="chart-container">
                          <canvas id="roiChart" width="400" height="300"></canvas>
                          <div className="chart-legend">
                            <div className="legend-item">
                              <div className="legend-color red"></div>
                              <span>Bez NEXT reviews BOOSTER: 199 zł</span>
                        </div>
                            <div className="legend-item">
                              <div className="legend-color green"></div>
                              <span>Z NEXT reviews BOOSTER: 960 zł</span>
                            </div>
                          </div>
                          <div className="chart-result">
                            <div className="result-highlight">
                              <span className="result-label">Dodatkowy zysk:</span>
                              <span className="result-value">+761 zł więcej!</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="chart-summary">
                          <div className="summary-item">
                            <div className="summary-icon">
                              <i data-feather="trending-up"></i>
                            </div>
                            <div className="summary-content">
                              <div className="summary-number">+383%</div>
                              <div className="summary-label">ROI w pierwszym miesiącu</div>
                            </div>
                          </div>
                          
                          <div className="summary-item">
                            <div className="summary-icon">
                              <i data-feather="dollar-sign"></i>
                            </div>
                            <div className="summary-content">
                              <div className="summary-number">+761 zł</div>
                              <div className="summary-label">Dodatkowy zysk miesięcznie</div>
                            </div>
                          </div>
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
                    <h2><b>Nie oszukuj się.</b> Możesz mieć najlepszy produkt, zespół i ofertę,<br /> ale jeśli nie świecisz ⭐⭐⭐⭐⭐ jesteś niewidzialny. <br /><b>A niewidzialne firmy nie zarabiają.</b></h2>
                    <p>Dołącz do firm, które już używają NEXT reviews BOOSTER i buduj mądrze swoją reputacje online</p>
                    <div className="hero-buttons">
                      <Link to="/register" className="btn btn-primary btn-large">
                          Rozpocznij bezpłatny okres próbny
                      </Link>
                        {/* <button className="btn btn-secondary btn-large">
                          Zobacz demo
                        </button> */}
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
                          <span className="amount">249</span>
                          <span className="period">/miesiąc</span>
                        </div>
                      </div>
                      <div className="pricing-features">
                        <ul>
                          <li>⭐ Do 50 wysłanych wiadomości SMS miesięcznie</li>
                          <li>⭐ Kody QR dla firmy</li>
                          <li>⭐ Podstawowe filtrowanie</li>
                          <li>⭐ Baza klientów (do 100)</li>
                          <li>⭐ Ograniczone wsparcie</li>
                        </ul>
                      </div>
                      <div className="pricing-cta">
                        <Link to="#kontakt" className="btn btn-secondary">
                          Skontaktuj się z nami
                        </Link>
                      </div>
                      <p className="sms-cost-note">+50zł koszt wysłanych wiadomości SMS</p>
                    </div>
                    
                    <div className="pricing-card featured">
                      <div className="popular-badge">Najpopularniejszy</div>
                      <div className="pricing-header">
                        <h3>Professional</h3>
                        <div className="price">
                          <span className="currency">zł</span>
                          <span className="amount">399</span>
                          <span className="period">/miesiąc</span>
                        </div>
                      </div>
                      <div className="pricing-features">
                        <ul>
                          <li>⭐ Do 100 wysłanych wiadomości SMS miesięcznie</li>
                          <li>⭐ Kody QR dla firmy</li>
                          <li>⭐ Zaawansowane filtrowanie</li>
                          <li>⭐ Do 300 klientów w bazie danych</li>
                          <li>⭐ Wsparcie email i telefon</li>
                          <li>⭐ Analityka i raporty</li>
                        </ul>
                      </div>
                      <div className="pricing-cta">
                        <Link to="/kontakt" className="btn btn-primary">
                          Skontaktuj się z nami
                        </Link>
                      </div>
                      <p className="sms-cost-note">+100zł koszt wysłanych wiadomości SMS</p>
                    </div>
                    
                    <div className="pricing-card">
                      <div className="pricing-header">
                        <h3>Enterprise</h3>
                        <div className="price">
                          <span className="amount">Cena do ustalenia</span>
                        </div>
                      </div>
                      <div className="pricing-features">
                        <ul>
                          <li>⭐ Wszystko z Professional</li>
                          <li>⭐ Integracje z systemami CRM</li>
                          <li>⭐ Wsparcie priorytetowe</li>
                          <li>⭐ Szkolenia dla zespołu</li>
                          <li>⭐ Opcjonalny dostęp do API</li>
                        </ul>
                      </div>
                      <div className="pricing-cta">
                        <Link to="/kontakt" className="btn btn-secondary">
                          Skontaktuj się z nami
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
                          <div className="contact-icon">
                            <i data-feather="mail"></i>
                          </div>
                          <div className="contact-details">
                            <h4>Email</h4>
                            <p>kontakt@next-reviews-booster.com</p>
                          </div>
                        </div>
                        
                        <div className="contact-method">
                          <div className="contact-icon">
                            <i data-feather="phone"></i>
                          </div>
                          <div className="contact-details">
                            <h4>Telefon</h4>
                            <p>+48 730 004 440</p>
                          </div>
                        </div>

                        <div className="contact-method">
                          <div className="contact-icon">
                            <i data-feather="clock"></i>
                          </div>
                          <div className="contact-details">
                            <h4>Pracujemy w godzinach</h4>
                            <p>Poniedziałek - Piątek: 9:00 - 17:00</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="contact-form">
                      <h3>Wyślij wiadomość</h3>
                      <form onSubmit={handleContactFormSubmit}>
                        <div className="form-group">
                          <input 
                            type="text" 
                            name="name"
                            placeholder="Imię i nazwisko" 
                            value={contactForm.name}
                            onChange={handleContactFormChange}
                            required 
                          />
                        </div>
                        <div className="form-group">
                          <input 
                            type="email" 
                            name="email"
                            placeholder="Email" 
                            value={contactForm.email}
                            onChange={handleContactFormChange}
                            required 
                          />
                        </div>
                        <div className="form-group">
                          <input 
                            type="text" 
                            name="company"
                            placeholder="Firma (opcjonalnie)" 
                            value={contactForm.company}
                            onChange={handleContactFormChange}
                          />
                        </div>
                        <div className="form-group">
                          <textarea 
                            name="message"
                            placeholder="Twoja wiadomość" 
                            rows="5" 
                            value={contactForm.message}
                            onChange={handleContactFormChange}
                            required
                          ></textarea>
                        </div>
                        
                        {contactFormMessage && (
                          <div className={`contact-message ${contactFormMessage.includes('błąd') || contactFormMessage.includes('Proszę') ? 'error' : 'success'}`}>
                            {contactFormMessage}
                          </div>
                        )}
                        
                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          disabled={contactFormLoading}
                        >
                          {contactFormLoading ? 'Wysyłanie...' : 'Wyślij wiadomość'}
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
