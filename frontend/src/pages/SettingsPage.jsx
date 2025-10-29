import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import useAuth from '../hooks/useAuth';
import { generateUsername } from '../utils/userUtils';
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
      messageTemplate: `Bardzo prosimy o zostawienie opinii o naszych usługach: [LINK]
Wasza opinia ma dla nas ogromne znaczenie i pomoże kolejnym klientom w wyborze.

Dziękujemy!`,
      autoSendEnabled: false,
      sendTime: {
        hour: 10,
        minute: 0
      }
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
      // Prefill email od razu po dostępności użytkownika, jeśli brak w stanie
      setSettings(prev => ({
        ...prev,
        userData: {
          ...prev.userData,
          email: prev.userData.email || user.email || ''
        }
      }));
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
      const username = generateUsername(user);
      console.log('🔧 Pobieranie ustawień dla:', username);
      
      const response = await apiService.getUserSettings(username);
      console.log('⚙️ Ustawienia otrzymane:', response);
      console.log('📧 Email z użytkownika:', user.email);
      console.log('📧 Email z backendu:', response.settings?.userData?.email);
      
      if (response.settings) {
        // Scal ustawienia z backendu z domyślnymi i upewnij się, że email jest ustawiony
        const finalEmail = (response.settings.userData && response.settings.userData.email && response.settings.userData.email.trim() !== '')
          ? response.settings.userData.email
          : (user.email || '');
        
        console.log('📧 Finalny email do ustawienia:', finalEmail);
        
        setSettings(prev => ({
          ...prev,
          ...response.settings,
          userData: {
            ...prev.userData,
            ...(response.settings.userData || {}),
            email: finalEmail
          }
        }));
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

    // Walidacja limitu znaków przed zapisem (sprawdź długość po podstawieniu zmiennych)
    if (settings.messaging.messageTemplate) {
      const processedMessage = settings.messaging.messageTemplate
        .replace(/\[LINK\]/g, 'next-reviews-booster.com/review/vqyrdqrhf4')
        .replace(/\[NAZWA_FIRMY\]/g, settings.userData.companyName || '[NAZWA_FIRMY]');
      
      if (processedMessage.length > 200) {
        alert(`❌ Treść wiadomości po podstawieniu zmiennych nie może przekraczać 200 znaków! Aktualna długość: ${processedMessage.length} znaków.`);
        return;
      }
    }

    try {
      setSaving(true);
      const username = generateUsername(user);
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
    // Walidacja limitu znaków dla szablonu wiadomości (sprawdź długość po podstawieniu zmiennych)
    if (section === 'messaging' && field === 'messageTemplate') {
      // Podstaw zmienne na rzeczywiste wartości dla walidacji
      const processedValue = value
        .replace(/\[LINK\]/g, 'next-reviews-booster.com/review/vqyrdqrhf4')
        .replace(/\[NAZWA_FIRMY\]/g, settings.userData.companyName || '[NAZWA_FIRMY]');
      
      // Jeśli wiadomość po podstawieniu przekracza 200 znaków, obetnij szablon
      if (processedValue.length > 200) {
        // Znajdź maksymalną długość szablonu, która po podstawieniu da 200 znaków
        const linkLength = 'next-reviews-booster.com/review/vqyrdqrhf4'.length;
        const companyNameLength = (settings.userData.companyName || '[NAZWA_FIRMY]').length;
        
        // Oblicz ile znaków można dodać do szablonu
        const linkCount = (value.match(/\[LINK\]/g) || []).length;
        const companyCount = (value.match(/\[NAZWA_FIRMY\]/g) || []).length;
        
        const maxTemplateLength = 200 - (linkCount * linkLength) - (companyCount * companyNameLength) + (linkCount * 6) + (companyCount * 12);
        
        if (value.length > maxTemplateLength) {
          value = value.substring(0, maxTemplateLength);
        }
      }
    }
    
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

  const handleTimeChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      messaging: {
        ...prev.messaging,
        sendTime: {
          ...prev.messaging.sendTime,
          [field]: parseInt(value)
        }
      }
    }));
  };

  // Funkcja kalkulacji kosztów SMS
  const calculateSMSCost = (message) => {
    if (!message || message.trim() === '') {
      return { segments: 0, cost: 0, hasPolishChars: false };
    }

    // Podstaw zmienne na rzeczywiste wartości
    const processedMessage = message
      .replace(/\[LINK\]/g, 'next-reviews-booster.com/review/vqyrdqrhf4')
      .replace(/\[NAZWA_FIRMY\]/g, settings.userData.companyName || '[NAZWA_FIRMY]');

    // Sprawdź czy wiadomość zawiera polskie znaki
    const polishCharsRegex = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
    const hasPolishChars = polishCharsRegex.test(processedMessage);
    
    // Określ limit znaków na segment
    const charsPerSegment = hasPolishChars ? 67 : 153;
    
    // Oblicz liczbę segmentów
    const segments = Math.ceil(processedMessage.length / charsPerSegment);
    
    // Koszt za segment: $0.0431
    const costPerSegment = 0.0431;
    const totalCost = segments * costPerSegment;
    
    return {
      segments,
      cost: totalCost,
      hasPolishChars,
      charsPerSegment,
      messageLength: processedMessage.length,
      originalLength: message.length,
      processedMessage
    };
  };

  // Oblicz koszt dla aktualnej wiadomości
  const smsCost = calculateSMSCost(settings.messaging.messageTemplate);


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
                <label htmlFor="googleCard" className="label-with-help">
                  Wizytówka Google
                  <div className="help-icon-container">
                    <span className="help-icon">?</span>
                    <div className="help-tooltip">
                      <div className="tooltip-content">
                        <h4>Gdzie znaleźć link do prośby o opinie?</h4>
                        <ol>
                          <li>Przejdź do <strong>Google My Business</strong></li>
                          <li>Zaloguj się na swoje konto</li>
                          <li>Wybierz swoją firmę</li>
                          <li>Kliknij <strong>"Uzyskaj więcej opinii"</strong></li>
                          <li>Skopiuj link do udostępnienia</li>
                          <li>Wklej go w to pole</li>
                        </ol>
                        <p><strong>Przykład:</strong> https://g.page/TwojaFirma/review</p>
                      </div>
                    </div>
                  </div>
                </label>
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
              
              <div className="character-count">
                <span className={`count ${smsCost.messageLength > 200 ? 'over-limit' : smsCost.messageLength > 180 ? 'near-limit' : ''}`}>
                  {smsCost.messageLength}/200 znaków
                </span>
              </div>
              {/* Kalkulator kosztów SMS */}
              <div className="sms-cost-calculator">
                <div className="cost-summary">
                  <div className="cost-item">
                    <span className="cost-label">Długość po wiadomości finałowej:</span>
                    <span className="cost-value">{smsCost.messageLength} znaków</span>
                  </div>
                  <div className="cost-item">
                    <span className="cost-label">Polskie znaki:</span>
                    <span className={`cost-value ${smsCost.hasPolishChars ? 'has-polish' : 'no-polish'}`}>
                      {smsCost.hasPolishChars ? 'Tak' : 'Nie'}
                    </span>
                  </div>
                  <div className="cost-item">
                    <span className="cost-label">Limit na segment:</span>
                    <span className="cost-value">{smsCost.charsPerSegment} znaków</span>
                  </div>
                  <div className="cost-item">
                    <span className="cost-label">Liczba segmentów:</span>
                    <span className="cost-value">{smsCost.segments}</span>
                  </div>
                  <div className="cost-item total-cost">
                    <span className="cost-label">Koszt SMS:</span>
                    <span className="cost-value">${smsCost.cost.toFixed(4)}</span>
                  </div>
                </div>
                <div className="cost-breakdown">
                  <small>
                    {smsCost.segments === 1 ? (
                      <>1 segment × $0.0431 = ${smsCost.cost.toFixed(4)}</>
                    ) : (
                      <>{smsCost.segments} segmenty × $0.0431 = ${smsCost.cost.toFixed(4)}</>
                    )}
                  </small>
                </div>
                {smsCost.originalLength !== smsCost.messageLength && (
                  <div className="message-preview">
                    <details>
                      <summary>Podgląd wiadomości po podstawieniu zmiennych</summary>
                      <div className="preview-content">
                        <pre>{smsCost.processedMessage}</pre>
                      </div>
                    </details>
                  </div>
                )}
              </div>
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

            {settings.messaging.autoSendEnabled && (
              <div className="form-group time-selector">
                <label htmlFor="sendTime">Godzina wysyłania automatycznych SMS-ów</label>
                <div className="time-inputs">
                  <div className="time-input-group">
                    <label htmlFor="sendHour">Godzina</label>
                    <select
                      id="sendHour"
                      value={settings.messaging.sendTime.hour}
                      onChange={(e) => handleTimeChange('hour', e.target.value)}
                      className="time-select"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="time-separator">:</div>
                  <div className="time-input-group">
                    <label htmlFor="sendMinute">Minuta</label>
                    <select
                      id="sendMinute"
                      value={settings.messaging.sendTime.minute}
                      onChange={(e) => handleTimeChange('minute', e.target.value)}
                      className="time-select"
                    >
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <small className="help-text">
                  SMS-y będą wysyłane codziennie o godzinie {settings.messaging.sendTime.hour.toString().padStart(2, '0')}:{settings.messaging.sendTime.minute.toString().padStart(2, '0')}
                </small>
              </div>
            )}
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