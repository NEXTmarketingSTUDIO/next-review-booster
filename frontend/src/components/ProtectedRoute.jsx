// Komponent chroniony - wymaga autoryzacji użytkownika
// Przekierowuje niezalogowanych użytkowników na stronę logowania

import React from 'react';
import useAuth from '../hooks/useAuth';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const ProtectedRoute = ({ children, requireEmailVerification = false }) => {
  const { user, loading, isAuthenticated, isEmailVerified } = useAuth();
  const [showLogin, setShowLogin] = React.useState(true);

  // Pokazuj loading podczas sprawdzania stanu autoryzacji
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner-large"></div>
        <p>Sprawdzanie autoryzacji...</p>
      </div>
    );
  }

  // Sprawdź czy użytkownik jest zalogowany
  if (!isAuthenticated()) {
    return (
      <div className="auth-page">
        {showLogin ? (
          <LoginForm 
            onLoginSuccess={() => {
              // Po udanym logowaniu komponent się automatycznie odświeży
              console.log('✅ Logowanie udane, odświeżanie komponentu');
            }}
            onSwitchToRegister={() => setShowLogin(false)}
          />
        ) : (
          <RegisterForm 
            onRegisterSuccess={() => {
              // Po udanej rejestracji przełącz na logowanie
              console.log('✅ Rejestracja udana, przełączanie na logowanie');
              setShowLogin(true);
            }}
            onSwitchToLogin={() => setShowLogin(true)}
          />
        )}
      </div>
    );
  }

  // Sprawdź czy wymagana jest weryfikacja email
  if (requireEmailVerification && !isEmailVerified()) {
    return (
      <div className="verification-required">
        <div className="verification-card">
          <div className="verification-icon">📧</div>
          <h2>Weryfikacja email wymagana</h2>
          <p>
            Sprawdź swoją skrzynkę email i kliknij link weryfikacyjny, 
            aby uzyskać pełny dostęp do aplikacji.
          </p>
          <p className="email-info">
            Email został wysłany na: <strong>{user.email}</strong>
          </p>
          <div className="verification-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => window.location.reload()}
            >
              Sprawdź ponownie
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => {
                // Tutaj można dodać funkcję ponownego wysłania emaila
                alert('Funkcja ponownego wysłania emaila będzie dostępna wkrótce.');
              }}
            >
              Wyślij ponownie
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Użytkownik jest zalogowany i ma wszystkie wymagane uprawnienia
  return children;
};

export default ProtectedRoute;
