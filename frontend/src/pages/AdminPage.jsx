import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import usePermissions from '../hooks/usePermissions';
import apiService from '../services/api';
import './AdminPage.css';

const AdminPage = () => {
  const { user } = useAuth();
  const { isAdmin, loading: permissionsLoading, permission } = usePermissions();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  const [userStatistics, setUserStatistics] = useState({});
  const [loadingStats, setLoadingStats] = useState(new Set());
  const [exchangeRate, setExchangeRate] = useState(4.0); 
  const [lastRateUpdate, setLastRateUpdate] = useState(null);
  const [loadingRate, setLoadingRate] = useState(false);
  const [editForm, setEditForm] = useState({
    permission: '',
    twilio: {
      account_sid: '',
      auth_token: '',
      phone_number: '',
      messaging_service_sid: ''
    }
  });

  useEffect(() => {
    // Sprawdź uprawnienia przed wykonaniem jakichkolwiek operacji
    const hasAdminPermission = isAdmin();
    
    if (!permissionsLoading && !hasAdminPermission) {
      setError('Brak uprawnień administratora');
      setLoading(false);
      return;
    }
    
    if (!permissionsLoading && hasAdminPermission) {
      fetchUsers();
      fetchExchangeRate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsLoading]); // Tylko permissionsLoading jako zależność

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllUsers();
      
      if (response.success) {
        setUsers(response.users);
      } else {
        setError(response.error || 'Błąd pobierania użytkowników');
      }
    } catch (err) {
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  const fetchExchangeRate = async () => {
    setLoadingRate(true);
    
    try {
      // API NBP dla kursu USD
      const response = await fetch('https://api.nbp.pl/api/exchangerates/rates/a/usd/?format=json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const rate = data.rates[0].mid; // Kurs średni NBP
      const date = data.rates[0].effectiveDate;
      
      setExchangeRate(rate);
      setLastRateUpdate(new Date(date));
    } catch (err) {
      // Pozostaw domyślny kurs 4.0
    } finally {
      setLoadingRate(false);
    }
  };

  const fetchUserStatistics = async (username) => {
    setLoadingStats(prev => new Set([...prev, username]));
    
    try {
      const stats = await apiService.getUserStatistics(username);
      
      setUserStatistics(prev => ({
        ...prev,
        [username]: stats
      }));
    } catch (err) {
      setUserStatistics(prev => ({
        ...prev,
        [username]: {
          total_clients: 0,
          total_reviews: 0,
          average_rating: 0,
          reviews_this_month: 0,
          sms_sent: 0,
          conversion_rate: 0
        }
      }));
    } finally {
      setLoadingStats(prev => {
        const newSet = new Set(prev);
        newSet.delete(username);
        return newSet;
      });
    }
  };

  const toggleUserExpansion = async (username) => {
    const newExpanded = new Set(expandedUsers);
    
    if (expandedUsers.has(username)) {
      // Zwijaj
      newExpanded.delete(username);
    } else {
      // Rozwijaj
      newExpanded.add(username);
      // Pobierz statystyki jeśli jeszcze ich nie ma
      if (!userStatistics[username]) {
        await fetchUserStatistics(username);
      }
    }
    
    setExpandedUsers(newExpanded);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      permission: user.permission || 'Demo',
      twilio: {
        account_sid: user.twilio?.account_sid || '',
        auth_token: user.twilio?.auth_token || '',
        phone_number: user.twilio?.phone_number || '',
        messaging_service_sid: user.twilio?.messaging_service_sid || ''
      }
    });
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    
    try {
      console.log('💾 AdminPage: Zapisywanie użytkownika:', selectedUser.username, editForm);
      
      // Aktualizuj uprawnienia
      const permissionResponse = await apiService.updateUserPermission(selectedUser.username, { permission: editForm.permission });
      if (!permissionResponse.success) {
        throw new Error(permissionResponse.error || 'Błąd aktualizacji uprawnień');
      }
      
      // Aktualizuj konfigurację Twilio
      const twilioResponse = await apiService.updateUserTwilio(selectedUser.username, editForm.twilio);
      if (!twilioResponse.success) {
        throw new Error(twilioResponse.error || 'Błąd aktualizacji Twilio');
      }
      
      // Aktualizuj lokalny stan
      setUsers(users.map(u => 
        u.username === selectedUser.username 
          ? { 
              ...u, 
              permission: editForm.permission, 
              twilio: editForm.twilio,
              smsLimit: permissionResponse.smsLimit || u.smsLimit
            }
          : u
      ));
      
      setShowEditModal(false);
      setSelectedUser(null);
      console.log('✅ AdminPage: Użytkownik zaktualizowany w bazie danych');
    } catch (err) {
      console.error('❌ AdminPage: Błąd aktualizacji użytkownika:', err);
      setError(`Błąd aktualizacji użytkownika: ${err.message}`);
    }
  };

  const getPermissionColor = (permission) => {
    switch (permission) {
      case 'Admin': return '#dc2626';
      case 'Professional': return '#2563eb';
      case 'Starter': return '#059669';
      case 'Demo': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPermissionLabel = (permission) => {
    switch (permission) {
      case 'Admin': return 'Administrator';
      case 'Professional': return 'Professional';
      case 'Starter': return 'Starter';
      case 'Demo': return 'Demo';
      default: return 'Nieznane';
    }
  };

  const calculateSMSCost = (user) => {
    const messageTemplate = user.messageTemplate || '';
    const companyName = user.companyName || '';
    const smsCount = user.smsCount || 0;
    
    if (!messageTemplate || messageTemplate.trim() === '') {
      // Użyj domyślnego szablonu jeśli brak
      const defaultTemplate = `Bardzo prosimy o zostawienie opinii o naszych usługach: [LINK]
Wasza opinia ma dla nas ogromne znaczenie i pomoże kolejnym klientom w wyborze.

Dziękujemy!`;
      
      // Podstaw zmienne na rzeczywiste wartości dla domyślnego szablonu
      const processedMessage = defaultTemplate
        .replace(/\[LINK\]/g, 'next-reviews-booster.com/review/vqyrdqrhf4')
        .replace(/\[NAZWA_FIRMY\]/g, companyName || '[NAZWA_FIRMY]');

      // Sprawdź czy wiadomość zawiera polskie znaki
      const polishCharsRegex = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
      const hasPolishChars = polishCharsRegex.test(processedMessage);
      
      // Określ limit znaków na segment
      const charsPerSegment = hasPolishChars ? 67 : 153;
      
      // Oblicz liczbę segmentów na jedną wiadomość
      const segments = Math.ceil(processedMessage.length / charsPerSegment);
      
      // Koszt za segment: $0.0431
      const costPerSegment = 0.0431;
      const costPerSMS = segments * costPerSegment;
      const totalCost = costPerSMS * smsCount;
      
      // Przelicz na PLN
      const costPerSMSPLN = costPerSMS * exchangeRate;
      const totalCostPLN = totalCost * exchangeRate;
      
      return {
        totalCost,
        totalCostPLN,
        segments,
        costPerSMS,
        costPerSMSPLN,
        hasPolishChars,
        processedMessageLength: processedMessage.length,
        charsPerSegment,
        usingDefaultTemplate: true
      };
    }
    
    if (smsCount === 0) {
      return { 
        totalCost: 0, 
        totalCostPLN: 0,
        segments: 0, 
        costPerSMS: 0,
        costPerSMSPLN: 0,
        hasPolishChars: false,
        error: 'Brak wysłanych SMS'
      };
    }

    // Podstaw zmienne na rzeczywiste wartości
    const processedMessage = messageTemplate
      .replace(/\[LINK\]/g, 'next-reviews-booster.com/review/vqyrdqrhf4')
      .replace(/\[NAZWA_FIRMY\]/g, companyName || '[NAZWA_FIRMY]');

    // Sprawdź czy wiadomość zawiera polskie znaki
    const polishCharsRegex = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
    const hasPolishChars = polishCharsRegex.test(processedMessage);
    
    // Określ limit znaków na segment
    const charsPerSegment = hasPolishChars ? 67 : 153;
    
    // Oblicz liczbę segmentów na jedną wiadomość
    const segments = Math.ceil(processedMessage.length / charsPerSegment);
    
    // Koszt za segment: $0.0431
    const costPerSegment = 0.0431;
    const costPerSMS = segments * costPerSegment;
    const totalCost = costPerSMS * smsCount;
    
    // Przelicz na PLN
    const costPerSMSPLN = costPerSMS * exchangeRate;
    const totalCostPLN = totalCost * exchangeRate;
    
    return {
      totalCost,
      totalCostPLN,
      segments,
      costPerSMS,
      costPerSMSPLN,
      hasPolishChars,
      processedMessageLength: processedMessage.length,
      charsPerSegment
    };
  };

  // Sprawdź uprawnienia przed renderowaniem
  if (permissionsLoading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p>Sprawdzanie uprawnień administratora...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="admin-page">
        <div className="admin-access-denied">
          <div className="access-denied-content">
            <h1>🚫 Brak uprawnień</h1>
            <p>Nie masz uprawnień administratora do przeglądania tej strony.</p>
            <p>Twoja aktualna rola: <strong>{permission || 'Nieznana'}</strong></p>
            <div className="access-denied-actions">
              <button 
                className="btn btn-primary" 
                onClick={() => window.history.back()}
              >
                ← Wróć
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="admin-title">
            <h1>Panel Administratora</h1>
            <p>Zarządzanie użytkownikami i ich uprawnieniami</p>
            <div className="admin-exchange-rate">
              💱 Kurs USD/PLN: <strong>{exchangeRate.toFixed(4)} zł</strong>
              {lastRateUpdate && (
                <span className="admin-rate-date">
                  ({lastRateUpdate.toLocaleDateString('pl-PL')})
                </span>
              )}
            </div>
          </div>
          <div className="admin-header-actions">
            <button 
              className="admin-refresh-btn admin-btn-secondary"
              onClick={fetchExchangeRate}
              disabled={loadingRate}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v6l3-3m-3 3-3-3"></path>
                <path d="M12 18v6"></path>
                <path d="M21 12h-6l3-3m-3 3 3 3"></path>
                <path d="M3 12h6"></path>
              </svg>
              {loadingRate ? 'Pobieranie...' : 'Aktualizuj kurs'}
            </button>
            <button 
              className="admin-refresh-btn"
              onClick={fetchUsers}
              disabled={loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                <path d="M3 21v-5h5"></path>
              </svg>
              {loading ? 'Odświeżanie...' : 'Odśwież użytkowników'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="admin-alert">
          <div className="admin-alert-icon">⚠️</div>
          <div className="admin-alert-content">
            <strong>Błąd:</strong> {error}
          </div>
        </div>
      )}

      <div className="admin-content">
        <div className="admin-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="m22 21-3-3m0 0a2 2 0 1 0-2.828-2.828L22 21"></path>
              </svg>
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-number">{users.length}</div>
              <div className="admin-stat-label">Wszyscy użytkownicy</div>
            </div>
          </div>
          
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon-admin">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-number">{users.filter(u => u.permission === 'Admin').length}</div>
              <div className="admin-stat-label">Administratorzy</div>
            </div>
          </div>
          
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon-professional">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="m22 21-3-3m0 0a2 2 0 1 0-2.828-2.828L22 21"></path>
              </svg>
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-number">{users.filter(u => u.permission === 'Professional').length}</div>
              <div className="admin-stat-label">Professional</div>
            </div>
          </div>
          
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon-starter">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-number">{users.filter(u => u.permission === 'Starter').length}</div>
              <div className="admin-stat-label">Starter</div>
            </div>
          </div>
          
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon-demo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-number">{users.filter(u => u.permission === 'Demo').length}</div>
              <div className="admin-stat-label">Demo</div>
            </div>
          </div>
        </div>

        <div className="admin-users-section">
          <div className="admin-section-header">
            <h2>Lista użytkowników</h2>
            <div className="admin-section-actions">
              <button 
                className="admin-btn admin-btn-primary"
                onClick={fetchUsers}
                disabled={loading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                  <path d="M3 21v-5h5"></path>
                </svg>
                Odśwież listę
              </button>
            </div>
          </div>

          {loading ? (
            <div className="admin-loading">
              <div className="admin-loading-spinner"></div>
              <p>Ładowanie użytkowników...</p>
            </div>
          ) : (
            <div className="admin-users-grid">
              {users.map((user) => (
                <div key={user.username} className="admin-user-card">
                  <div className="admin-user-header">
                    <div className="admin-user-avatar">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="admin-user-info">
                      <div className="admin-user-name">{user.username}</div>
                      <div className="admin-user-email">{user.email || 'Brak email'}</div>
                      <div className="admin-user-company">{user.companyName || 'Brak nazwy firmy'}</div>
                    </div>
                    <div className="admin-user-actions">
                      <button 
                        className="admin-btn admin-btn-sm admin-btn-secondary"
                        onClick={() => toggleUserExpansion(user.username)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {expandedUsers.has(user.username) ? (
                            <>
                              <polyline points="18,15 12,9 6,15"></polyline>
                            </>
                          ) : (
                            <>
                              <polyline points="6,9 12,15 18,9"></polyline>
                            </>
                          )}
                        </svg>
                        {expandedUsers.has(user.username) ? 'Zwiń' : 'Rozwiń'}
                      </button>
                      <button 
                        className="admin-btn admin-btn-sm admin-btn-primary"
                        onClick={() => handleEditUser(user)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edytuj
                      </button>
                    </div>
                  </div>
                  
                  <div className="admin-user-details">
                    <div className="admin-user-detail">
                      <span className="admin-user-detail-label">Uprawnienia:</span>
                      <span 
                        className="admin-user-permission"
                        style={{ backgroundColor: getPermissionColor(user.permission) }}
                      >
                        {getPermissionLabel(user.permission)}
                      </span>
                    </div>
                    
                    <div className="admin-user-detail">
                      <span className="admin-user-detail-label">Koszty SMS:</span>
                      <span className="admin-user-sms-cost">
                        {(() => {
                          const costData = calculateSMSCost(user);
                          if (costData.error) {
                            return (
                              <span className="admin-cost-error">
                                {costData.error}
                              </span>
                            );
                          }
                          return `${costData.totalCostPLN.toFixed(2)} zł`;
                        })()}
                        <span className="admin-user-sms-cost-detail">
                          {(() => {
                            const costData = calculateSMSCost(user);
                            if (costData.error) {
                              return '';
                            }
                            return `(${user.smsCount || 0} SMS × ${costData.segments} seg × ${(costData.costPerSMS * exchangeRate).toFixed(4)} zł)`;
                          })()}
                        </span>
                      </span>
                    </div>
                    
                    <div className="admin-user-detail">
                      <span className="admin-user-detail-label">SMS:</span>
                      <span className="admin-user-sms-stats">
                        {user.smsCount || 0} / {user.smsLimit || 10} 
                        <span className="admin-user-sms-percentage">
                          ({Math.round(((user.smsCount || 0) / (user.smsLimit || 10)) * 100)}%)
                        </span>
                      </span>
                    </div>
                    
                    <div className="admin-user-detail">
                      <span className="admin-user-detail-label">Klienci:</span>
                      <span className="admin-user-clients-count">
                        {user.clientsCount || 0} klientów
                      </span>
                    </div>
                  </div>
                  
                  {/* Rozwijalne statystyki */}
                  {expandedUsers.has(user.username) && (
                    <div className="admin-user-statistics">
                      <div className="admin-user-statistics-header">
                        <h4>📊 Szczegółowe statystyki</h4>
                      </div>
                      
                      {loadingStats.has(user.username) ? (
                        <div className="admin-stats-loading">
                          <div className="admin-loading-spinner"></div>
                          <p>Ładowanie statystyk...</p>
                        </div>
                      ) : (
                        <div className="admin-stats-grid">
                          <div className="admin-stat-item">
                            <div className="admin-stat-icon">👥</div>
                            <div className="admin-stat-content">
                              <div className="admin-stat-number">
                                {userStatistics[user.username]?.total_clients || 0}
                              </div>
                              <div className="admin-stat-label">Łączna liczba klientów</div>
                            </div>
                          </div>
                          
                          <div className="admin-stat-item">
                            <div className="admin-stat-icon">⭐</div>
                            <div className="admin-stat-content">
                              <div className="admin-stat-number">
                                {userStatistics[user.username]?.total_reviews || 0}
                              </div>
                              <div className="admin-stat-label">Wystawione opinie</div>
                            </div>
                          </div>
                          
                          <div className="admin-stat-item">
                            <div className="admin-stat-icon">📈</div>
                            <div className="admin-stat-content">
                              <div className="admin-stat-number">
                                {userStatistics[user.username]?.average_rating || 0}
                              </div>
                              <div className="admin-stat-label">Średnia ocena</div>
                            </div>
                          </div>
                          
                          <div className="admin-stat-item">
                            <div className="admin-stat-icon">📅</div>
                            <div className="admin-stat-content">
                              <div className="admin-stat-number">
                                {userStatistics[user.username]?.reviews_this_month || 0}
                              </div>
                              <div className="admin-stat-label">Opinie w tym miesiącu</div>
                            </div>
                          </div>
                          
                          <div className="admin-stat-item">
                            <div className="admin-stat-icon">📱</div>
                            <div className="admin-stat-content">
                              <div className="admin-stat-number">
                                {userStatistics[user.username]?.sms_sent || 0}
                              </div>
                              <div className="admin-stat-label">Wysłane SMS-y</div>
                            </div>
                          </div>
                          
                          <div className="admin-stat-item">
                            <div className="admin-stat-icon">🎯</div>
                            <div className="admin-stat-content">
                              <div className="admin-stat-number">
                                {userStatistics[user.username]?.conversion_rate || 0}%
                              </div>
                              <div className="admin-stat-label">Wskaźnik konwersji</div>
                            </div>
                          </div>
                          
                          <div className="admin-stat-item admin-stat-cost">
                            <div className="admin-stat-icon">💰</div>
                            <div className="admin-stat-content">
                              <div className="admin-stat-number">
                                {(() => {
                                  const statsBasedUser = {
                                    ...user,
                                    smsCount: userStatistics[user.username]?.sms_sent || 0
                                  };
                                  return calculateSMSCost(statsBasedUser).totalCostPLN.toFixed(2);
                                })()} zł
                              </div>
                              <div className="admin-stat-label">Łączne koszty SMS</div>
                            </div>
                          </div>
                          
                          <div className="admin-stat-item admin-stat-segments">
                            <div className="admin-stat-icon">📋</div>
                            <div className="admin-stat-content">
                              <div className="admin-stat-number">
                                {(() => {
                                  const costData = calculateSMSCost(user);
                                  return costData.segments;
                                })()}
                              </div>
                              <div className="admin-stat-label">
                                Segmentów na SMS
                                {(() => {
                                  const costData = calculateSMSCost(user);
                                  return costData.hasPolishChars ? ' (polskie znaki)' : ' (standard)';
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal edycji użytkownika */}
      {showEditModal && selectedUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>Edytuj użytkownika: {selectedUser.username}</h3>
              <button 
                className="admin-modal-close"
                onClick={() => setShowEditModal(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-form-label">Uprawnienia</label>
                <select 
                  className="admin-form-select"
                  value={editForm.permission}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    permission: e.target.value
                  })}
                  disabled={selectedUser.permission === 'Admin'}
                >
                  <option value="Demo">Demo</option>
                  <option value="Starter">Starter</option>
                  <option value="Professional">Professional</option>
                  {selectedUser.permission === 'Admin' && (
                    <option value="Admin">Admin</option>
                  )}
                </select>
                {selectedUser.permission === 'Admin' && (
                  <small className="admin-form-help">
                    Nie można zmienić uprawnień administratora
                  </small>
                )}
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Twilio Account SID</label>
                <input 
                  type="text"
                  className="admin-form-input"
                  value={editForm.twilio.account_sid}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    twilio: {
                      ...editForm.twilio,
                      account_sid: e.target.value
                    }
                  })}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Twilio Auth Token</label>
                <input 
                  type="password"
                  className="admin-form-input"
                  value={editForm.twilio.auth_token}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    twilio: {
                      ...editForm.twilio,
                      auth_token: e.target.value
                    }
                  })}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Numer telefonu Twilio</label>
                <input 
                  type="text"
                  className="admin-form-input"
                  value={editForm.twilio.phone_number}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    twilio: {
                      ...editForm.twilio,
                      phone_number: e.target.value
                    }
                  })}
                  placeholder="+48123456789"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Messaging Service SID</label>
                <input 
                  type="text"
                  className="admin-form-input"
                  value={editForm.twilio.messaging_service_sid}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    twilio: {
                      ...editForm.twilio,
                      messaging_service_sid: e.target.value
                    }
                  })}
                  placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>
            </div>
            
            <div className="admin-modal-footer">
              <button 
                className="admin-btn admin-btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                Anuluj
              </button>
              <button 
                className="admin-btn admin-btn-primary"
                onClick={handleSaveUser}
              >
                Zapisz zmiany
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
