// Komponent formularza logowania
// Używa Firebase Authentication do logowania użytkowników

import React, { useState } from 'react';
import firebaseAuthService from '../services/firebaseAuth';
import './AuthForms.css';

const LoginForm = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obsługa zmian w formularzu
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Wyczyść błąd przy zmianie danych
    if (error) setError(null);
  };

  // Obsługa wysłania formularza
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Próba logowania użytkownika');
      
      const result = await firebaseAuthService.login(
        formData.email, 
        formData.password
      );

      if (result.success) {
        console.log('✅ Logowanie udane:', result.user);
        onLoginSuccess(result.user);
      } else {
        console.error('❌ Błąd logowania:', result.error);
        setError(result.error);
      }
    } catch (err) {
      console.error('❌ Nieoczekiwany błąd logowania:', err);
      setError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  // Obsługa reset hasła
  const handleResetPassword = async () => {
    if (!formData.email) {
      setError('Wprowadź adres email, aby zresetować hasło.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await firebaseAuthService.resetPassword(formData.email);
      
      if (result.success) {
        setError(null);
        alert('Email z instrukcjami resetowania hasła został wysłany na adres: ' + formData.email);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('❌ Błąd reset hasła:', err);
      setError('Wystąpił błąd podczas wysyłania emaila resetującego.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form">
        <div className="auth-header">
          <h2>Zaloguj się</h2>
          <p>Witaj z powrotem w NextReviews!</p>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-content">
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
              placeholder="Twoje hasło"
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
                Logowanie...
              </>
            ) : (
              'Zaloguj się'
            )}
          </button>

          <div className="auth-actions">
            <button 
              type="button" 
              className="btn-link"
              onClick={handleResetPassword}
              disabled={loading}
            >
              Zapomniałeś hasła?
            </button>
          </div>
        </form>

        <div className="auth-switch">
          <p>Nie masz jeszcze konta?</p>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onSwitchToRegister}
            disabled={loading}
          >
            Zarejestruj się
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
