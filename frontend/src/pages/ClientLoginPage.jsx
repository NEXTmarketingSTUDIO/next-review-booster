import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ClientLoginPage.css';

const ClientLoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
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
    if (!formData.name.trim() || !formData.surname.trim() || !formData.email.trim() || !formData.phone.trim()) {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/client-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Błąd podczas zapisywania danych');
      }

      const data = await response.json();
      
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
              <label htmlFor="surname">Nazwisko *</label>
              <input
                type="text"
                id="surname"
                name="surname"
                value={formData.surname}
                onChange={handleInputChange}
                placeholder="Wprowadź swoje nazwisko"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="surname">Email *</label>
              <input
                type="text"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Wprowadź swój adres email"
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
