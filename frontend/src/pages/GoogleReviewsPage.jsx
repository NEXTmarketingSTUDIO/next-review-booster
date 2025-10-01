import React from 'react';
import './GoogleReviewsPage.css';

const GoogleReviewsPage = () => {
  return (
    <div className="google-reviews-page">

      <div className="content-grid">
        <div className="content-card">
          <div className="card-icon">📊</div>
          <h3>Statystyki opinii</h3>
          <p>Przeglądaj średnią ocenę i liczbę opinii na Google</p>
          <div className="card-status">W przygotowaniu</div>
        </div>

        <div className="content-card">
          <div className="card-icon">📝</div>
          <h3>Najnowsze opinie</h3>
          <p>Zobacz najnowsze opinie od klientów na Google</p>
          <div className="card-status">W przygotowaniu</div>
        </div>

        <div className="content-card">
          <div className="card-icon">🔗</div>
          <h3>Link do Google</h3>
          <p>Bezpośredni link do Twojej wizytówki Google My Business</p>
          <div className="card-status">W przygotowaniu</div>
        </div>

        <div className="content-card">
          <div className="card-icon">📈</div>
          <h3>Trendy ocen</h3>
          <p>Analiza zmian w ocenach w czasie</p>
          <div className="card-status">W przygotowaniu</div>
        </div>

        <div className="content-card">
          <div className="card-icon">💬</div>
          <h3>Odpowiedzi na opinie</h3>
          <p>Odpowiadaj na opinie klientów bezpośrednio z platformy</p>
          <div className="card-status">W przygotowaniu</div>
        </div>

        <div className="content-card">
          <div className="card-icon">🎯</div>
          <h3>Strategia opinii</h3>
          <p>Narzędzia do zwiększania liczby pozytywnych opinii</p>
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

export default GoogleReviewsPage;
