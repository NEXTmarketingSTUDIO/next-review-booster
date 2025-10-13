import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import useAuth from '../hooks/useAuth';
import './ClientsPage.css';

const ClientsPage = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [expandedReviews, setExpandedReviews] = useState(new Set());
  const [expandedClients, setExpandedClients] = useState(new Set());
  const [sendingSMS, setSendingSMS] = useState(new Set());
  const [sendingToAll, setSendingToAll] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    countryCode: '+48',
    note: ''
  });
  const [filters, setFilters] = useState({
    source: 'all',
    smsStatus: 'all',
    rating: 'all',
    sortBy: 'name_asc',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user?.email) {
      fetchClients();
    } else if (user === null) {
      // User jest null (nie zalogowany) - zatrzymaj loading
      setLoading(false);
      setClients([]);
    }
    // Jeśli user jest undefined (jeszcze się ładuje), nie rób nic
  }, [user]);

  // Obsługa zmiany rozmiaru okna
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Zamykanie menu po kliknięciu poza nim
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.burger-menu')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  // Pozycjonowanie menu po otwarciu
  useEffect(() => {
    if (openMenuId) {
      const menu = document.querySelector('.burger-menu-content');
      const button = document.querySelector(`[data-client-id="${openMenuId}"]`);
      
      if (menu && button) {
        const rect = button.getBoundingClientRect();
        
        // Pozycjonuj menu nad przyciskiem
        let top = rect.top - menu.offsetHeight - 5;
        let left = rect.right - menu.offsetWidth;
        
        // Jeśli menu wychodzi poza lewą krawędź ekranu, wyrównaj do lewej strony przycisku
        if (left < 10) {
          left = rect.left;
        }
        
        // Jeśli menu wychodzi poza górną krawędź ekranu, pokaż poniżej przycisku
        if (top < 10) {
          top = rect.bottom + 5;
        }
        
        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;
      }
    }
  }, [openMenuId]);

  const fetchClients = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔄 Pobieranie klientów dla:', user.email);
      // Używamy email jako username (można zmienić na displayName)
      const username = user.email.split('@')[0]; // Pobierz część przed @
      console.log('👤 Username:', username);
      const response = await apiService.getClients(username);
      console.log('📊 Odpowiedź API:', response);
      setClients(response.clients || []);
    } catch (error) {
      console.error('❌ Błąd podczas pobierania klientów:', error);
      setClients([]); // Ustaw pustą listę w przypadku błędu
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.email) return;
    
    try {
      const username = user.email.split('@')[0];
      
      // Przygotuj dane z połączonym numerem telefonu
      const clientData = {
        ...formData,
        phone: combinePhoneNumber(formData.countryCode, formData.phone)
      };
      
      if (editingClient) {
        // Edytuj istniejącego klienta
        await apiService.updateClient(username, editingClient.id, clientData);
      } else {
        // Dodaj nowego klienta
        await apiService.createClient(username, clientData);
      }

      // Resetuj formularz
      setFormData({
        name: '',
        phone: '',
        countryCode: '+48',
        note: ''
      });
      setShowForm(false);
      setEditingClient(null);
      fetchClients();
    } catch (error) {
      console.error('Błąd podczas zapisywania klienta:', error);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    // Parsuj numer telefonu, aby wyodrębnić kod kraju i numer
    const phoneData = parsePhoneNumber(client.phone || '');
    setFormData({
      name: client.name || '',
      phone: phoneData.number || '',
      countryCode: phoneData.countryCode || '+48',
      note: client.note || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (clientId) => {
    if (!user?.email) return;
    
    if (window.confirm('Czy na pewno chcesz usunąć tego klienta?')) {
      try {
        const username = user.email.split('@')[0];
        await apiService.deleteClient(username, clientId);
        fetchClients();
      } catch (error) {
        console.error('Błąd podczas usuwania klienta:', error);
      }
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Funkcja do parsowania numeru telefonu
  const parsePhoneNumber = (fullPhone) => {
    if (!fullPhone) return { countryCode: '+48', number: '' };
    
    // Sprawdź czy numer zaczyna się od + (ma kod kraju)
    if (fullPhone.startsWith('+')) {
      // Znajdź gdzie kończy się kod kraju (2-4 cyfry po +)
      const match = fullPhone.match(/^(\+\d{1,4})(.*)$/);
      if (match) {
        return {
          countryCode: match[1],
          number: match[2].trim()
        };
      }
    }
    
    // Jeśli nie ma kodu kraju, założ że to polski numer
    return {
      countryCode: '+48',
      number: fullPhone
    };
  };

  // Funkcja do łączenia kodu kraju z numerem
  const combinePhoneNumber = (countryCode, number) => {
    if (!number) return '';
    return `${countryCode}${number}`;
  };

  // Funkcje do obsługi filtrów
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      source: 'all',
      smsStatus: 'all',
      rating: 'all',
      sortBy: 'name_asc',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Funkcja filtrowania i sortowania klientów
  const getFilteredClients = () => {
    if (!clients) return [];

    let filteredClients = clients.filter(client => {
      // Filtrowanie po źródle pochodzenia
      if (filters.source !== 'all') {
        if (client.source !== filters.source) return false;
      }

      // Filtrowanie po statusie SMS
      if (filters.smsStatus !== 'all') {
        if (filters.smsStatus === 'sent' && client.sms_count === 0) return false;
        if (filters.smsStatus === 'not_sent' && client.sms_count > 0) return false;
        if (filters.smsStatus === 'limit_reached' && client.sms_count < 2) return false;
      }

      // Filtrowanie po ocenie
      if (filters.rating !== 'all') {
        if (filters.rating === 'no_rating' && client.stars > 0) return false;
        if (filters.rating === 'has_rating' && client.stars === 0) return false;
        if (filters.rating === 'low_rating' && (client.stars === 0 || client.stars > 4)) return false;
      }

      // Filtrowanie po dacie SMS
      if (filters.dateFrom || filters.dateTo) {
        if (!client.last_sms_sent) return false;
        
        const smsDate = new Date(client.last_sms_sent);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
        
        if (fromDate && smsDate < fromDate) return false;
        if (toDate && smsDate > toDate) return false;
      }

      return true;
    });

    // Sortowanie
    filteredClients.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'date_asc':
          const dateA = a.last_sms_sent ? new Date(a.last_sms_sent) : new Date(0);
          const dateB = b.last_sms_sent ? new Date(b.last_sms_sent) : new Date(0);
          return dateA - dateB;
        case 'date_desc':
          const dateA2 = a.last_sms_sent ? new Date(a.last_sms_sent) : new Date(0);
          const dateB2 = b.last_sms_sent ? new Date(b.last_sms_sent) : new Date(0);
          return dateB2 - dateA2;
        case 'rating_asc':
          return (a.stars || 0) - (b.stars || 0);
        case 'rating_desc':
          return (b.stars || 0) - (a.stars || 0);
        default:
          return 0;
      }
    });

    return filteredClients;
  };

  const copyReviewCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      alert('✅ Kod recenzji został skopiowany do schowka!');
    } catch (error) {
      console.error('Błąd kopiowania:', error);
      // Fallback dla starszych przeglądarek
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('✅ Kod recenzji został skopiowany do schowka!');
    }
  };

  const toggleReviewExpansion = (clientId) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const toggleClientExpansion = (clientId) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const handleSendSMS = async (client) => {
    if (!user?.email || !client.phone) {
      alert('❌ Klient nie ma numeru telefonu');
      return;
    }

    if (client.sms_count >= 2) {
      alert('❌ Osiągnięto limit SMS dla tego klienta (maksymalnie 2 SMS)');
      return;
    }

    if (window.confirm(`Czy chcesz wysłać SMS do ${client.name} (${client.phone})?`)) {
      try {
        setSendingSMS(prev => new Set(prev).add(client.id));
        
        const username = user.email.split('@')[0];
        const result = await apiService.sendSMS(username, client.id);
        
        alert('✅ SMS został wysłany pomyślnie!');
        fetchClients(); // Odśwież listę klientów
      } catch (error) {
        console.error('❌ Błąd wysyłania SMS:', error);
        alert('❌ Wystąpił błąd podczas wysyłania SMS: ' + (error.response?.data?.detail || error.message));
      } finally {
        setSendingSMS(prev => {
          const newSet = new Set(prev);
          newSet.delete(client.id);
          return newSet;
        });
      }
    }
  };

  const toggleBurgerMenu = (clientId) => {
    setOpenMenuId(openMenuId === clientId ? null : clientId);
  };

  const handleSendSMSToAll = async () => {
    if (!user?.email) {
      alert('❌ Nie jesteś zalogowany');
      return;
    }

    // Sprawdź czy są klienci do wysłania
    const filteredClients = getFilteredClients();
    const clientsToSend = filteredClients.filter(client => 
      client.phone && 
      client.review_code && 
      client.review_status !== 'completed' &&
      client.sms_count < 2
    );

    if (clientsToSend.length === 0) {
      alert('❌ Brak klientów do wysłania wiadomości (wszyscy mają status "completed", brak numeru telefonu lub osiągnęli limit SMS)');
      return;
    }

    if (window.confirm(`Czy chcesz wysłać SMS do wszystkich ${clientsToSend.length} klientów (pomijając tych z limitem SMS)?`)) {
      try {
        setSendingToAll(true);
        
        const username = user.email.split('@')[0];
        const result = await apiService.sendSMSToAllClients(username);
        
        alert(`✅ Proces zakończony! Wysłano ${result.sent} z ${result.total_found} klientów`);
        
        if (result.errors && result.errors.length > 0) {
          console.warn('⚠️ Niektóre SMS-y nie zostały wysłane:', result.errors);
        }
        
        fetchClients(); // Odśwież listę klientów
      } catch (error) {
        console.error('❌ Błąd wysyłania SMS do wszystkich klientów:', error);
        alert('❌ Wystąpił błąd podczas wysyłania SMS: ' + (error.response?.data?.detail || error.message));
      } finally {
        setSendingToAll(false);
      }
    }
  };


  return (
    <div className="clients-page">
      <div className="container">

        {/* Formularz dodawania/edycji klienta */}
        {showForm && (
          <div className="client-form-overlay">
            <div className="client-form">
              <div className="form-header">
                <h3>{editingClient ? 'Edytuj klienta' : 'Dodaj nowego klienta'}</h3>
                <button 
                  className="close-btn"
                  onClick={() => {
                    setShowForm(false);
                    setEditingClient(null);
                    setFormData({
                      name: '',
                      phone: '',
                      countryCode: '+48',
                      note: ''
                    });
                  }}
                  aria-label="Zamknij formularz"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Imię *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Telefon</label>
                  <div className="phone-input-container">
                    <select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleInputChange}
                      className="country-code-select"
                    >
                      <option value="+48">🇵🇱 +48</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+420">🇨🇿 +420</option>
                      <option value="+421">🇸🇰 +421</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+33">🇫🇷 +33</option>
                      <option value="+39">🇮🇹 +39</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+31">🇳🇱 +31</option>
                      <option value="+32">🇧🇪 +32</option>
                      <option value="+43">🇦🇹 +43</option>
                      <option value="+41">🇨🇭 +41</option>
                      <option value="+45">🇩🇰 +45</option>
                      <option value="+46">🇸🇪 +46</option>
                      <option value="+47">🇳🇴 +47</option>
                      <option value="+358">🇫🇮 +358</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+7">🇷🇺 +7</option>
                    </select>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="123456789"
                      className="phone-number-input"
                    />
                  </div>
                </div>


                <div className="form-group">
                  <label htmlFor="note">Notatka</label>
                  <textarea
                    id="note"
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Dodaj notatkę o kliencie..."
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                    Anuluj
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingClient ? 'Zapisz zmiany' : 'Dodaj klienta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filtry klientów */}
        <div className="clients-filters">
          <div className="filters-header">
            <h3>Filtry</h3>
            <button 
              className="toggle-filters-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Ukryj filtry' : 'Pokaż filtry'}
              <span className={`filter-icon ${showFilters ? 'expanded' : ''}`}>▼</span>
            </button>
          </div>
          
          {showFilters && (
            <div className="filters-content">
              <div className="filter-row">
                <div className="filter-group">
                  <label htmlFor="source">Źródło:</label>
                  <select
                    id="source"
                    value={filters.source}
                    onChange={(e) => handleFilterChange('source', e.target.value)}
                  >
                    <option value="all">Wszystkie</option>
                    <option value="CRM">CRM</option>
                    <option value="QR">QR</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="smsStatus">Status SMS:</label>
                  <select
                    id="smsStatus"
                    value={filters.smsStatus}
                    onChange={(e) => handleFilterChange('smsStatus', e.target.value)}
                  >
                    <option value="all">Wszystkie</option>
                    <option value="not_sent">Nie wysłano</option>
                    <option value="sent">Wysłano</option>
                    <option value="limit_reached">Limit osiągnięty</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="rating">Ocena:</label>
                  <select
                    id="rating"
                    value={filters.rating}
                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                  >
                    <option value="all">Wszystkie</option>
                    <option value="no_rating">Brak oceny</option>
                    <option value="has_rating">Ma ocenę</option>
                    <option value="low_rating">Niska ocena (1-4)</option>
                  </select>
                </div>
              </div>
              
              <div className="filter-row">
                <div className="filter-group">
                  <label htmlFor="sortBy">Sortuj według:</label>
                  <select
                    id="sortBy"
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <option value="name_asc">Imię A-Z</option>
                    <option value="name_desc">Imię Z-A</option>
                    <option value="date_asc">Data SMS (najstarsze)</option>
                    <option value="date_desc">Data SMS (najnowsze)</option>
                    <option value="rating_asc">Ocena (najniższe)</option>
                    <option value="rating_desc">Ocena (najwyższe)</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="dateFrom">Data SMS od:</label>
                  <input
                    type="date"
                    id="dateFrom"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  />
                </div>
                
                <div className="filter-group">
                  <label htmlFor="dateTo">Data SMS do:</label>
                  <input
                    type="date"
                    id="dateTo"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="filter-row">
                <div className="filter-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={clearFilters}
                  >
                    Wyczyść filtry
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Przycisk wysyłania do wszystkich klientów */}
        {getFilteredClients().length > 0 && (
          <div className="clients-header-actions">
            <button 
              className={`btn-test-send ${sendingToAll ? 'loading' : ''}`}
              onClick={handleSendSMSToAll}
              disabled={sendingToAll}
              title="Wyślij SMS do wszystkich klientów o statusie recenzji różnym od 'completed'"
            >
              {sendingToAll ? (
                <>
                  <span className="loading-spinner-small"></span>
                  Wysyłanie...
                </>
              ) : (
                <>
                  📱 Wyślij do wszystkich
                </>
              )}
            </button>
          </div>
        )}

        {/* Lista klientów */}
        <div className="clients-content">
          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Ładowanie klientów...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i data-feather="users"></i>
              </div>
              <h3>Brak klientów</h3>
              <p>Dodaj pierwszego klienta, aby rozpocząć zarządzanie bazą danych</p>
            </div>
          ) : (
            <>
              {/* Tabela dla desktop */}
              <div className="clients-table-container desktop-only">
                <table className="clients-table">
                  <thead>
                    <tr>
                      <th>Imię</th>
                      <th>Telefon</th>
                      <th>Ocena</th>
                      <th>Recenzja</th>
                      <th>Data ostatniego SMS</th>
                      <th>Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredClients().map((client) => (
                      <React.Fragment key={client.id}>
                        <tr className="client-row">
                        <td className="client-name">
                          <button 
                            className="expand-client-btn"
                            onClick={() => toggleClientExpansion(client.id)}
                            title={expandedClients.has(client.id) ? "Zwiń szczegóły" : "Rozwiń szczegóły"}
                          >
                            <span className={`expand-icon ${expandedClients.has(client.id) ? 'expanded' : ''}`}>
                              ▼
                            </span>
                            <strong>{client.name}</strong>
                          </button>
                        </td>
                        <td className="client-phone">
                          {client.phone || '-'}
                        </td>
                        <td className="client-stars">
                          {client.stars > 0 ? (
                            <span className="stars-display">
                              {'★'.repeat(client.stars)}{'☆'.repeat(5 - client.stars)}
                              <span className="stars-count">({client.stars}/5)</span>
                            </span>
                          ) : (
                            <span className="no-rating">Brak oceny</span>
                          )}
                        </td>
                        <td className="client-review">
                          {client.review ? (
                            <div className="review-container">
                              <span className="review-text">
                                {expandedReviews.has(client.id) 
                                  ? client.review 
                                  : client.review.length > 30 
                                    ? `${client.review.substring(0, 30)}...` 
                                    : client.review
                                }
                              </span>
                              {client.review.length > 30 && (
                                <button 
                                  className="expand-review-btn"
                                  onClick={() => toggleReviewExpansion(client.id)}
                                  title={expandedReviews.has(client.id) ? "Zwiń recenzję" : "Rozwiń recenzję"}
                                >
                                  {expandedReviews.has(client.id) ? "Zwiń" : "Rozwiń"}
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="no-review">Brak recenzji</span>
                          )}
                        </td>
                        <td className="client-last-sms">
                          {client.last_sms_sent ?
                            (typeof client.last_sms_sent === 'string' 
                              ? new Date(client.last_sms_sent).toLocaleDateString('pl-PL')
                              : client.last_sms_sent.toLocaleDateString('pl-PL')
                            ) : 'Nieznana data'
                          }
                        </td>
                        <td className="client-actions">
                          <div className="burger-menu">
                            <button 
                              className="burger-btn"
                              data-client-id={client.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBurgerMenu(client.id);
                              }}
                              title="Menu akcji"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="19" cy="12" r="1"></circle>
                                <circle cx="5" cy="12" r="1"></circle>
                              </svg>
                            </button>
                            
                            {openMenuId === client.id && (
                              <div className="burger-menu-content">
                                {client.phone && (
                                  <button 
                                    className={`menu-item sms-item ${sendingSMS.has(client.id) ? 'loading' : ''} ${client.sms_count >= 2 ? 'disabled' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSendSMS(client);
                                      setOpenMenuId(null);
                                    }}
                                    disabled={sendingSMS.has(client.id) || client.sms_count >= 2}
                                    title={client.sms_count >= 2 ? `Limit SMS osiągnięty (${client.sms_count}/2)` : 'Wyślij SMS'}
                                  >
                                    {sendingSMS.has(client.id) ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="loading-icon">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <path d="M12 6v6l4 2"></path>
                                      </svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
                                        <path d="M12 18h.01"></path>
                                      </svg>
                                    )}
                                    <span>{client.sms_count >= 2 ? 'SMS (Limit)' : 'SMS'}</span>
                                  </button>
                                )}
                                
                                <button 
                                  className="menu-item edit-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(client);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                  <span>Edytuj</span>
                                </button>
                                
                                <button 
                                  className="menu-item delete-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(client.id);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3,6 5,6 21,6"></polyline>
                                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                    <line x1="10" x2="10" y1="11" y2="17"></line>
                                    <line x1="14" x2="14" y1="11" y2="17"></line>
                                  </svg>
                                  <span>Usuń</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                      
                      {/* Rozwijany wiersz z dodatkowymi informacjami */}
                      {expandedClients.has(client.id) && (
                        <tr className="client-details-row">
                          <td colSpan="6" className="client-details-cell">
                            <div className="client-details-content">
                              <div className="details-grid">
                                <div className="detail-item">
                                  <label>Notatki:</label>
                                  <span className="detail-value">
                                    {client.note || 'Brak notatek'}
                                  </span>
                                </div>
                                <div className="detail-item">
                                  <label>Źródło pochodzenia:</label>
                                  <span className={`source-badge ${client.source === 'QR' ? 'source-qr' : 'source-crm'}`}>
                                    {client.source || 'CRM'}
                                  </span>
                                </div>
                                <div className="detail-item">
                                  <label>Limit SMS:</label>
                                  <span className={`sms-counter ${client.sms_count >= 2 ? 'limit-reached' : client.sms_count > 0 ? 'has-sms' : ''}`}>
                                    {client.sms_count}/2
                                  </span>
                                </div>
                                <div className="detail-item">
                                  <label>Data utworzenia:</label>
                                  <span className="detail-value">
                                    {client.created_at ? 
                                      (typeof client.created_at === 'string' 
                                        ? new Date(client.created_at).toLocaleDateString('pl-PL')
                                        : client.created_at.toLocaleDateString('pl-PL')
                                      ) : 'Nieznana data'
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Karty dla mobile */}
              <div className="clients-cards-container mobile-only">
                {getFilteredClients().map((client) => (
                  <div key={client.id} className="client-card">
                    <div className="client-card-header">
                      <div className="client-card-name">
                        <button 
                          className="expand-client-btn-mobile"
                          onClick={() => toggleClientExpansion(client.id)}
                          title={expandedClients.has(client.id) ? "Zwiń szczegóły" : "Rozwiń szczegóły"}
                        >
                          <span className={`expand-icon ${expandedClients.has(client.id) ? 'expanded' : ''}`}>
                            ▼
                          </span>
                          <strong>{client.name}</strong>
                        </button>
                      </div>
                      <div className="client-card-actions">
                        <div className="burger-menu">
                          <button 
                            className="burger-btn"
                            data-client-id={client.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBurgerMenu(client.id);
                            }}
                            title="Menu akcji"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="1"></circle>
                              <circle cx="19" cy="12" r="1"></circle>
                              <circle cx="5" cy="12" r="1"></circle>
                            </svg>
                          </button>
                          
                          {openMenuId === client.id && (
                            <div className="burger-menu-content">
                              {client.phone && (
                                <button 
                                  className={`menu-item sms-item ${sendingSMS.has(client.id) ? 'loading' : ''} ${client.sms_count >= 2 ? 'disabled' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendSMS(client);
                                    setOpenMenuId(null);
                                  }}
                                  disabled={sendingSMS.has(client.id) || client.sms_count >= 2}
                                  title={client.sms_count >= 2 ? `Limit SMS osiągnięty (${client.sms_count}/2)` : 'Wyślij SMS'}
                                >
                                  {sendingSMS.has(client.id) ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="loading-icon">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <path d="M12 6v6l4 2"></path>
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
                                      <path d="M12 18h.01"></path>
                                    </svg>
                                  )}
                                  <span>{client.sms_count >= 2 ? 'SMS (Limit)' : 'SMS'}</span>
                                </button>
                              )}
                              
                              <button 
                                className="menu-item edit-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(client);
                                  setOpenMenuId(null);
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                <span>Edytuj</span>
                              </button>
                              
                              <button 
                                className="menu-item delete-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(client.id);
                                  setOpenMenuId(null);
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3,6 5,6 21,6"></polyline>
                                  <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                  <line x1="10" x2="10" y1="11" y2="17"></line>
                                  <line x1="14" x2="14" y1="11" y2="17"></line>
                                </svg>
                                <span>Usuń</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="client-card-body">
                      <div className="client-card-phone">
                        {client.phone || '-'}
                      </div>
                      <div className="client-card-review">
                        {client.review ? (
                          <span className="review-text">
                            {client.review.length > 30 
                              ? `${client.review.substring(0, 30)}...` 
                              : client.review
                            }
                          </span>
                        ) : (
                          <span className="no-review">Brak recenzji</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="client-card-footer">
                      <div className="client-card-stars">
                        {client.stars > 0 ? (
                          <span className="stars-display">
                            {'★'.repeat(client.stars)}{'☆'.repeat(5 - client.stars)}
                          </span>
                        ) : (
                          <span className="no-rating">Brak oceny</span>
                        )}
                      </div>
                      <div className="client-card-date">
                        {client.last_sms_sent ? 
                          (typeof client.last_sms_sent === 'string' 
                            ? new Date(client.last_sms_sent).toLocaleDateString('pl-PL')
                            : client.last_sms_sent.toLocaleDateString('pl-PL')
                          ) : 'Brak wysłanego SMS '
                        }
                      </div>
                    </div>
                    
                    {/* Rozwijana sekcja z dodatkowymi informacjami dla mobile */}
                    {expandedClients.has(client.id) && (
                      <div className="client-card-details-mobile">
                        <div className="details-grid-mobile">
                          <div className="detail-item-mobile">
                            <label>Notatki:</label>
                            <span className="detail-value">
                              {client.note || 'Brak notatek'}
                            </span>
                          </div>
                          <div className="detail-item-mobile">
                            <label>Źródło pochodzenia:</label>
                            <span className={`source-badge ${client.source === 'QR' ? 'source-qr' : 'source-crm'}`}>
                              {client.source || 'CRM'}
                            </span>
                          </div>
                          <div className="detail-item-mobile">
                            <label>Limit SMS:</label>
                            <span className={`sms-counter ${client.sms_count >= 2 ? 'limit-reached' : client.sms_count > 0 ? 'has-sms' : ''}`}>
                              {client.sms_count}/2
                            </span>
                          </div>
                          <div className="detail-item-mobile">
                            <label>Data utworzenia:</label>
                            <span className="detail-value">
                              {client.created_at ? 
                                (typeof client.created_at === 'string' 
                                  ? new Date(client.created_at).toLocaleDateString('pl-PL')
                                  : client.created_at.toLocaleDateString('pl-PL')
                                ) : 'Nieznana data'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stały przycisk dodawania klienta */}
      <button 
        className="floating-add-btn"
        onClick={() => setShowForm(true)}
        title="Dodaj nowego klienta"
        aria-label="Dodaj nowego klienta"
      >
        <span className="add-icon">+</span>
      </button>
    </div>
  );
};

export default ClientsPage;
