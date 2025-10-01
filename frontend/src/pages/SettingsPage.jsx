import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import useAuth from '../hooks/useAuth';
import './SettingsPage.css';

const SettingsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // Dane użytkownika
    userData: {
      name: '',
      surname: '',
      email: '',
      companyName: '',
      googleCard: ''
    },
    // Opcje wysyłki wiadomości
    messaging: {
      reminderFrequency: 7, // dni
      messageTemplate: `Dzień dobry!

Chciałbym przypomnieć o możliwości wystawienia opinii o naszych usługach. 
Wasza opinia jest dla nas bardzo ważna i pomoże innym klientom w podjęciu decyzji.

Link do wystawienia opinii: [LINK]

Z góry dziękuję za poświęcony czas!

Z poważaniem,
[NAZWA_FIRMY]`,
      autoSendEnabled: false
    },
    // Konfiguracja Twilio
    twilio: {
      account_sid: '',
      auth_token: '',
      phone_number: ''
    },
  });

  useEffect(() => {
    if (user?.email) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const username = user.email.split('@')[0];
      console.log('🔧 Pobieranie ustawień dla:', username);
      
      const response = await apiService.getUserSettings(username);
      console.log('⚙️ Ustawienia otrzymane:', response);
      
      if (response.settings) {
        setSettings(response.settings);
      } else {
        // Ustaw domyślne wartości
        setSettings(prev => ({
          ...prev,
          userData: {
            ...prev.userData,
            email: user.email || '',
            name: user.displayName?.split(' ')[0] || '',
            surname: user.displayName?.split(' ').slice(1).join(' ') || ''
          }
        }));
      }
    } catch (error) {
      console.error('❌ Błąd podczas pobierania ustawień:', error);
      // Ustaw domyślne wartości przy błędzie
      setSettings(prev => ({
        ...prev,
        userData: {
          ...prev.userData,
          email: user.email || '',
          name: user.displayName?.split(' ')[0] || '',
          surname: user.displayName?.split(' ').slice(1).join(' ') || ''
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.email) return;

    try {
      setSaving(true);
      const username = user.email.split('@')[0];
      console.log('💾 Zapisuję ustawienia:', settings);
      
      await apiService.saveUserSettings(username, settings);
      alert('✅ Ustawienia zostały zapisane pomyślnie!');
    } catch (error) {
      console.error('❌ Błąd podczas zapisywania ustawień:', error);
      alert('❌ Wystąpił błąd podczas zapisywania ustawień');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSliderChange = (value) => {
    setSettings(prev => ({
      ...prev,
      messaging: {
        ...prev.messaging,
        reminderFrequency: parseInt(value)
      }
    }));
  };


  if (loading) {
    return (
      <div className="settings-page">
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Ładowanie ustawień...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="container">

        <form onSubmit={handleSave} className="settings-form">
          {/* Dane użytkownika */}
          <div className="settings-section">
            <div className="section-header">
              <h2>👤 Dane użytkownika</h2>
              <p>Podstawowe informacje o Tobie i Twojej firmie</p>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Imię *</label>
                <input
                  type="text"
                  id="name"
                  value={settings.userData.name}
                  onChange={(e) => handleInputChange('userData', 'name', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="surname">Nazwisko *</label>
                <input
                  type="text"
                  id="surname"
                  value={settings.userData.surname}
                  onChange={(e) => handleInputChange('userData', 'surname', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  value={settings.userData.email}
                  onChange={(e) => handleInputChange('userData', 'email', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="companyName">Nazwa firmy</label>
                <input
                  type="text"
                  id="companyName"
                  value={settings.userData.companyName}
                  onChange={(e) => handleInputChange('userData', 'companyName', e.target.value)}
                  placeholder="Nazwa Twojej firmy"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="googleCard">Wizytówka Google</label>
                <input
                  type="url"
                  id="googleCard"
                  value={settings.userData.googleCard}
                  onChange={(e) => handleInputChange('userData', 'googleCard', e.target.value)}
                  placeholder="https://g.page/TwojaFirma"
                />
                <small className="help-text">
                  Link do Twojej wizytówki Google My Business
                </small>
              </div>
            </div>
          </div>

          {/* Opcje wysyłki wiadomości */}
          <div className="settings-section">
            <div className="section-header">
              <h2>📧 Opcje wysyłki wiadomości</h2>
              <p>Skonfiguruj automatyczne przypomnienia dla klientów</p>
            </div>

            <div className="form-group">
              <label htmlFor="reminderFrequency">
                Częstotliwość wysyłania przypomnień: {settings.messaging.reminderFrequency} dni
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  id="reminderFrequency"
                  min="1"
                  max="30"
                  value={settings.messaging.reminderFrequency}
                  onChange={(e) => handleSliderChange(e.target.value)}
                  className="frequency-slider"
                />
                <div className="slider-labels">
                  <span>1 dzień</span>
                  <span>30 dni</span>
                </div>
              </div>
              <small className="help-text">
                Jak często wysyłać przypomnienia o wystawienie opinii
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="messageTemplate">Treść wiadomości</label>
              <textarea
                id="messageTemplate"
                value={settings.messaging.messageTemplate}
                onChange={(e) => handleInputChange('messaging', 'messageTemplate', e.target.value)}
                rows="12"
                placeholder="Wprowadź treść wiadomości..."
              />
              <small className="help-text">
                Dostępne zmienne: [LINK] - link do opinii, [NAZWA_FIRMY] - nazwa Twojej firmy
              </small>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.messaging.autoSendEnabled}
                  onChange={(e) => handleInputChange('messaging', 'autoSendEnabled', e.target.checked)}
                />
                <span className="checkbox-text">Włącz automatyczne wysyłanie SMS-ów</span>
              </label>
              <small className="help-text">
                Automatycznie wysyłaj SMS-y z przypomnieniami o opiniach
              </small>
            </div>
          </div>

          {/* Przyciski akcji */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={fetchSettings}>
              Anuluj
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Zapisywanie...' : 'Zapisz ustawienia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;