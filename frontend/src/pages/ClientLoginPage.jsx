import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import './ClientLoginPage.css';

const ClientLoginPage = () => {
  const navigate = useNavigate();
  const { username } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Walidacja
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError('Proszę wypełnić wszystkie pola');
      return;
    }

    if (formData.phone.length < 9) {
      setError('Numer telefonu musi mieć co najmniej 9 cyfr');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Zapisz dane klienta i pobierz kod recenzji
      if (!username) {
        setError('Brak informacji o użytkowniku');
        return;
      }
      
      const data = await apiService.clientLogin(username, formData);
      
      // Przekieruj do formularza recenzji
      navigate(`/review/${data.review_code}`);
      
    } catch (error) {
      console.error('Błąd:', error);
      setError('Wystąpił błąd podczas zapisywania danych. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="client-login-page">
      <div className="container">
        <div className="login-header">
          <h1>Witamy!</h1>
          <p>Proszę podać swoje dane, aby przejść do formularza opinii</p>
        </div>

        <div className="login-form-container">
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="name">Imię *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Wprowadź swoje imię"
                required
              />
            </div>


            <div className="form-group">
              <label htmlFor="phone">Numer telefonu *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Wprowadź numer telefonu"
                required
              />
            </div>

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
                disabled={loading}
              >
                {loading ? 'Przetwarzanie...' : 'Przejdź do opinii'}
              </button>
            </div>
          </form>
        </div>

        <div className="login-footer">
          <p>Twoje dane są bezpieczne i będą używane tylko do celów związanych z opinią.</p>
        </div>
      </div>
    </div>
  );
};

export default ClientLoginPage;
