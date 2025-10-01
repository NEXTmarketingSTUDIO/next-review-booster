import React from 'react';
import './VisitsPage.css';

const VisitsPage = () => {
  return (
    <div className="visits-page">

      <div className="content-grid">
        <div className="content-card">
          <div className="card-icon">📋</div>
          <h3>Harmonogram wizyt</h3>
          <p>Przeglądaj i zarządzaj zaplanowanymi wizytami klientów</p>
          <div className="card-status">W przygotowaniu</div>
        </div>

        <div className="content-card">
          <div className="card-icon">⏰</div>
          <h3>Terminy</h3>
          <p>Dodawaj nowe terminy i modyfikuj istniejące</p>
          <div className="card-status">W przygotowaniu</div>
        </div>

        <div className="content-card">
          <div className="card-icon">📊</div>
          <h3>Statystyki wizyt</h3>
          <p>Analiza frekwencji i popularności terminów</p>
          <div className="card-status">W przygotowaniu</div>
        </div>

        <div className="content-card">
          <div className="card-icon">🔔</div>
          <h3>Przypomnienia</h3>
          <p>Automatyczne powiadomienia o nadchodzących wizytach</p>
          <div className="card-status">W przygotowaniu</div>
        </div>
      </div>

      <div className="coming-soon">
        <h2>🚀 Funkcjonalność w przygotowaniu</h2>
        <p>Ta sekcja będzie dostępna w najbliższej aktualizacji</p>
      </div>
    </div>
  );
};

export default VisitsPage;
