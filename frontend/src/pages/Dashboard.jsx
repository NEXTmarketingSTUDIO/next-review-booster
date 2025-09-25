// Strona Dashboard
// Chroniona strona dostępna tylko dla zalogowanych użytkowników

import React from 'react';
import useAuth from '../hooks/useAuth';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isEmailVerified } = useAuth();

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Witaj w panelu użytkownika!</p>
        </div>

        <div className="dashboard-content">
          {/* Karta informacji o użytkowniku */}
          <div className="user-info-card card">
            <h3>Twoje informacje</h3>
            <div className="user-details">
              <div className="detail-item">
                <span className="label">Email:</span>
                <span className="value">{user?.email}</span>
              </div>
              <div className="detail-item">
                <span className="label">Nazwa:</span>
                <span className="value">{user?.displayName || 'Nie ustawiono'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Email zweryfikowany:</span>
                <span className={`value ${isEmailVerified() ? 'verified' : 'unverified'}`}>
                  {isEmailVerified() ? '✅ Tak' : '⚠️ Nie'}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">ID użytkownika:</span>
                <span className="value user-id">{user?.uid}</span>
              </div>
            </div>
          </div>

          {/* Karta statusu weryfikacji */}
          {!isEmailVerified() && (
            <div className="verification-card card">
              <div className="verification-icon">📧</div>
              <h3>Weryfikacja email</h3>
              <p>
                Sprawdź swoją skrzynkę email i kliknij link weryfikacyjny, 
                aby uzyskać pełny dostęp do wszystkich funkcji aplikacji.
              </p>
              <button className="btn btn-primary">
                Wyślij ponownie email weryfikacyjny
              </button>
            </div>
          )}

          {/* Karta statystyk */}
          <div className="stats-card card">
            <h3>Twoje statystyki</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">0</div>
                <div className="stat-label">Recenzje</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">0</div>
                <div className="stat-label">Produkty</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">0</div>
                <div className="stat-label">Oceny</div>
              </div>
            </div>
          </div>

          {/* Karta szybkich akcji */}
          <div className="actions-card card">
            <h3>Szybkie akcje</h3>
            <div className="actions-grid">
              <button className="action-btn">
                <span className="action-icon">📝</span>
                <span className="action-text">Dodaj recenzję</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">🛍️</span>
                <span className="action-text">Dodaj produkt</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">📊</span>
                <span className="action-text">Zobacz statystyki</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">⚙️</span>
                <span className="action-text">Ustawienia</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
