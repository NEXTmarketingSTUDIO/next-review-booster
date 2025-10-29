import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import apiService from '../services/api';
import './ReviewFormPage.css';

const ReviewFormPage = () => {
  const { reviewCode } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clientInfo, setClientInfo] = useState(null);
  const [formData, setFormData] = useState({
    stars: 0,
    review: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showThanks, setShowThanks] = useState(false);

  useEffect(() => {
    if (reviewCode) {
      fetchClientInfo();
    }
  }, [reviewCode]);

  const fetchClientInfo = async () => {
    try {
      setLoading(true);
      console.log('🔍 Pobieranie informacji dla kodu:', reviewCode);
      
      const response = await apiService.get(`/review/${reviewCode}`);
      console.log('✅ Informacje o kliencie:', response.data);
      console.log('🔗 Google Card URL:', response.data.google_card);
      
      setClientInfo(response.data);
    } catch (error) {
      console.error('❌ Błąd podczas pobierania informacji:', error);
      console.error('❌ Szczegóły błędu:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      if (error.response?.status === 404) {
        setError('Nieprawidłowy kod recenzji');
      } else if (error.response?.status === 500) {
        setError('Błąd serwera. Spróbuj ponownie później.');
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        setError('Brak połączenia z serwerem. Sprawdź połączenie internetowe.');
      } else {
        setError('Nieprawidłowy kod recenzji');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStarClick = (rating) => {
    setFormData(prev => ({
      ...prev,
      stars: rating
    }));
    
    // Jeśli wybrano 5 gwiazdek, pokaż podziękowania
    if (rating === 5) {
      setShowThanks(true);
    } else {
      setShowThanks(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.stars === 0) {
      setError('Proszę wybrać ocenę');
      return;
    }

    // Dla 5 gwiazdek nie wymagamy recenzji
    if (formData.stars !== 5 && formData.review.trim().length < 10) {
      setError('Recenzja musi mieć co najmniej 10 znaków');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      console.log('📤 Wysyłanie oceny:', formData);
      
      const response = await apiService.post(`/review/${reviewCode}`, formData);
      console.log('✅ Odpowiedź:', response.data);
      
      // Jeśli to 5 gwiazdek, przekieruj na Google
      console.log('🔍 Debug - clientInfo:', clientInfo);
      console.log('🔍 Debug - google_card:', clientInfo?.google_card);
      console.log('🔍 Debug - google_card type:', typeof clientInfo?.google_card);
      console.log('🔍 Debug - google_card length:', clientInfo?.google_card?.length);
      console.log('🔍 Debug - google_card trimmed:', clientInfo?.google_card?.trim());
      console.log('🔍 Debug - formData.stars:', formData.stars);
      
      if (formData.stars === 5 && clientInfo?.google_card && clientInfo.google_card.trim() !== '') {
        console.log('🔗 Przekierowanie na Google Card:', clientInfo.google_card);
        
        // Sprawdź czy to urządzenie mobilne
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
          // Na telefonie użyj window.location.href zamiast window.open
          console.log('📱 Wykryto urządzenie mobilne - używam window.location.href');
          
          // Dodaj małe opóźnienie aby upewnić się, że formularz został zapisany
          setTimeout(() => {
            window.location.href = clientInfo.google_card;
          }, 1000);
        } else {
          // Na desktopie użyj window.open
          console.log('💻 Wykryto desktop - używam window.open');
          window.open(clientInfo.google_card, '_blank');
        }
      } else if (formData.stars === 5) {
        console.log('⚠️ Brak Google Card URL w ustawieniach');
        console.log('🔍 clientInfo:', clientInfo);
        console.log('🔍 google_card value:', clientInfo?.google_card);
      }
      
      setSuccess(true);
    } catch (error) {
      console.error('❌ Błąd podczas wysyłania oceny:', error);
      setError('Wystąpił błąd podczas zapisywania oceny');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (loading) {
    return (
      <div className="review-form-page">
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Ładowanie formularza...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !clientInfo) {
    return (
      <div className="review-form-page">
        <div className="container">
          <div className="error-state">
            <div className="error-icon">❌</div>
            <h2>Błąd</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="review-form-page">
        <div className="container">
          <div className="success-state">
            <h2>Dziękujemy!</h2>
            <p>Twoja opinia została pomyślnie zapisana.</p>
            <p>Bardzo cenimy sobie Twoje uwagi!</p>
            
            {/* Pokaż przycisk do Google Card jeśli to 5 gwiazdek i jest URL */}
            {formData.stars === 5 && clientInfo?.google_card && clientInfo.google_card.trim() !== '' && (
              <div className="google-card-section">
                <div className="google-card-content">
                  <h4>🎯 Zostaw oficjalną recenzję na Google</h4>
                  <p>Kliknij poniżej, aby przejść do naszej wizytówki Google i zostawić oficjalną recenzję, która będzie widoczna dla innych klientów.</p>
                  <a 
                    href={clientInfo.google_card} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="google-card-link"
                  >
                    <span className="google-icon">🔗</span>
                    Przejdź do Google
                    <span className="external-icon">↗</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="review-form-page">
      <div className="container">
        <div className="review-header">
          <h1>Wystaw opinię</h1>
          <p>Podziel się swoją opinią o naszych usługach</p>
        </div>

        <div className="review-form-container">
          <form onSubmit={handleSubmit} className="review-form">
            <div className="form-section">
              <h3>Jak oceniasz nasze usługi?</h3>
              
              <div className="stars-container">
                <div className="stars-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${formData.stars >= star ? 'active' : ''}`}
                      onClick={() => handleStarClick(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="stars-label">
                  {formData.stars === 0 && 'Wybierz ocenę'}
                  {formData.stars === 1 && 'Bardzo słabo'}
                  {formData.stars === 2 && 'Słabo'}
                  {formData.stars === 3 && 'Średnio'}
                  {formData.stars === 4 && 'Dobrze'}
                  {formData.stars === 5 && 'Bardzo dobrze'}
                </p>
              </div>
            </div>

            {showThanks ? (
              <div className="form-section thanks-section">
                <div className="thanks-content">
                  <div className="thanks-icon">🎉</div>
                  <h3>Dziękujemy za 5 gwiazdek!</h3>
                  <p>Bardzo cieszymy się, że nasze usługi spełniły Twoje oczekiwania!</p>
                  <p>Po wysłaniu opinii zostaniesz przekierowany na naszą wizytówkę Google, gdzie możesz zostawić oficjalną recenzję.</p>
                </div>
              </div>
            ) : (
              <div className="form-section">
                <label htmlFor="review">
                  <h3>Napisz swoją opinię</h3>
                  <p>Opisz swoje doświadczenia z naszymi usługami (minimum 10 znaków)</p>
                </label>
                
                <textarea
                  id="review"
                  name="review"
                  value={formData.review}
                  onChange={handleInputChange}
                  rows="6"
                  placeholder="Napisz swoją opinię o naszych usługach..."
                  required
                />
                
                <div className="char-counter">
                  {formData.review.length}/500 znaków
                </div>
              </div>
            )}

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting || formData.stars === 0}
              >
                {submitting ? 'Zapisywanie...' : showThanks ? 'Wyślij opinię i przejdź do Google' : 'Wyślij opinię'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewFormPage;
