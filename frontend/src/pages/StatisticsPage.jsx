import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import apiService from '../services/api';
import './StatisticsPage.css';

const StatisticsPage = () => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState({
    totalClients: 0,
    totalReviews: 0,
    averageRating: 0,
    reviewsThisMonth: 0,
    smsSent: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      fetchStatistics();
    }
  }, [user]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const username = user.email.split('@')[0];
      
      // Pobierz klientów
      const clientsResponse = await apiService.getClients(username);
      const clients = clientsResponse.clients || [];
      
      // Oblicz statystyki
      const totalClients = clients.length;
      const totalReviews = clients.filter(client => client.review_status === 'completed').length;
      const averageRating = clients.reduce((sum, client) => sum + (client.rating || 0), 0) / totalClients || 0;
      const reviewsThisMonth = clients.filter(client => {
        if (!client.review_date) return false;
        const reviewDate = new Date(client.review_date);
        const now = new Date();
        return reviewDate.getMonth() === now.getMonth() && reviewDate.getFullYear() === now.getFullYear();
      }).length;
      
      const smsSent = clients.filter(client => client.last_sms_sent).length;
      const conversionRate = totalClients > 0 ? (totalReviews / totalClients) * 100 : 0;

      setStatistics({
        totalClients,
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewsThisMonth,
        smsSent,
        conversionRate: Math.round(conversionRate * 10) / 10
      });
    } catch (error) {
      console.error('Błąd podczas pobierania statystyk:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="statistics-page">
        <div className="statistics-header">
          <h1>📊 Statystyki</h1>
          <p>Analiza Twoich wyników</p>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Ładowanie statystyk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-page">

      <div className="statistics-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Łączna liczba klientów</h3>
            <div className="stat-number">{statistics.totalClients}</div>
            <p className="stat-description">Wszyscy Twoi klienci</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>Wystawione opinie</h3>
            <div className="stat-number">{statistics.totalReviews}</div>
            <p className="stat-description">Opinie od klientów</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Średnia ocena</h3>
            <div className="stat-number">{statistics.averageRating}</div>
            <p className="stat-description">Średnia z wszystkich opinii</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Opinie w tym miesiącu</h3>
            <div className="stat-number">{statistics.reviewsThisMonth}</div>
            <p className="stat-description">Nowe opinie w {new Date().toLocaleDateString('pl-PL', { month: 'long' })}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📱</div>
          <div className="stat-content">
            <h3>Wysłane SMS-y</h3>
            <div className="stat-number">{statistics.smsSent}</div>
            <p className="stat-description">Przypomnienia wysłane</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Wskaźnik konwersji</h3>
            <div className="stat-number">{statistics.conversionRate}%</div>
            <p className="stat-description">Procent klientów, którzy wystawili opinię</p>
          </div>
        </div>
      </div>

      <div className="statistics-actions">
        <button className="btn-primary" onClick={fetchStatistics}>
          🔄 Odśwież dane
        </button>
      </div>
    </div>
  );
};

export default StatisticsPage;
