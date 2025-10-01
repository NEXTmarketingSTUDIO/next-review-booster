import React from 'react';
import './ExperimentsPage.css';

const ExperimentsPage = () => {
  return (
    <div className="experiments-page">

      <div className="content-grid">
        <div className="content-card">
          <div className="card-icon">📝</div>
          <h3>Testy wiadomości</h3>
          <p>Porównuj różne wersje wiadomości SMS</p>
          <div className="card-status">W przygotowaniu</div>
        </div>

        <div className="content-card">
          <div className="card-icon">⏰</div>
          <h3>Testy czasu wysyłki</h3>
          <p>Sprawdź, o której godzinie klienci najczęściej odpowiadają</p>
          <div className="card-status">W przygotowaniu</div>
        </div>

        <div className="content-card">
          <div className="card-icon">📊</div>
          <h3>Analiza wyników</h3>
          <p>Porównaj skuteczność różnych wersji</p>
          <div className="card-status">W przygotowaniu</div>
        </div>

        <div className="content-card">
          <div className="card-icon">🎯</div>
          <h3>Segmentacja</h3>
          <p>Testuj różne wersje na różnych grupach klientów</p>
          <div className="card-status">W przygotowaniu</div>
        </div>

        <div className="content-card">
          <div className="card-icon">📈</div>
          <h3>Statystyki testów</h3>
          <p>Szczegółowe raporty z przeprowadzonych eksperymentów</p>
          <div className="card-status">W przygotowaniu</div>
        </div>

        <div className="content-card">
          <div className="card-icon">🚀</div>
          <h3>Automatyzacja</h3>
          <p>Automatyczne uruchamianie testów A/B</p>
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

export default ExperimentsPage;
