// Komponent formularza rejestracji
// Używa Firebase Authentication do tworzenia nowych kont użytkowników

import React, { useState } from 'react';
import firebaseAuthService from '../services/firebaseAuth';
import './AuthForms.css';

const RegisterForm = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Obsługa zmian w formularzu
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Wyczyść błędy przy zmianie danych
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  // Walidacja formularza
  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Hasła nie są identyczne.');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków.');
      return false;
    }

    if (!formData.displayName.trim()) {
      setError('Nazwa użytkownika jest wymagana.');
      return false;
    }

    return true;
  };

  // Obsługa wysłania formularza
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Walidacja
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Próba rejestracji użytkownika');
      
      const result = await firebaseAuthService.register(
        formData.email,
        formData.password,
        formData.displayName
      );

      if (result.success) {
        console.log('✅ Rejestracja udana:', result.user);
        setSuccess(true);
        
        // Wyczyść formularz
        setFormData({
          displayName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });

        // Poinformuj o sukcesie
        setTimeout(() => {
          onRegisterSuccess(result.user);
        }, 2000);
      } else {
        console.error('❌ Błąd rejestracji:', result.error);
        setError(result.error);
      }
    } catch (err) {
      console.error('❌ Nieoczekiwany błąd rejestracji:', err);
      setError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-form-container">
        <div className="auth-form success-form">
          <div className="success-icon">✅</div>
          <h2>Rejestracja zakończona pomyślnie!</h2>
          <p>
            Twoje konto zostało utworzone. Sprawdź swoją skrzynkę email 
            i kliknij link weryfikacyjny, aby aktywować konto.
          </p>
          <p className="email-info">
            Email został wysłany na: <strong>{formData.email}</strong>
          </p>
          <button 
            className="btn btn-primary"
            onClick={onSwitchToLogin}
          >
            Przejdź do logowania
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form-container">
      <div className="auth-form">
        <div className="auth-header">
          <h2>Zarejestruj się</h2>
          <p>Dołącz do społeczności NextReviews!</p>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-content">
          <div className="form-group">
            <label htmlFor="displayName">Nazwa użytkownika</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Twoja nazwa"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Adres email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="twoj@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Hasło</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 znaków"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Potwierdź hasło</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Wprowadź hasło ponownie"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Rejestracja...
              </>
            ) : (
              'Zarejestruj się'
            )}
          </button>
        </form>

        <div className="auth-switch">
          <p>Masz już konto?</p>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onSwitchToLogin}
            disabled={loading}
          >
            Zaloguj się
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
