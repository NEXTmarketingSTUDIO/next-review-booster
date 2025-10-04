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
  const [sendingSMS, setSendingSMS] = useState(new Set());
  const [sendingToAll, setSendingToAll] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    note: ''
  });

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
      
      if (editingClient) {
        // Edytuj istniejącego klienta
        await apiService.updateClient(username, editingClient.id, formData);
      } else {
        // Dodaj nowego klienta
        await apiService.createClient(username, formData);
      }

      // Resetuj formularz
      setFormData({
        name: '',
        phone: '',
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
    setFormData({
      name: client.name || '',
      phone: client.phone || '',
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

  const handleSendSMS = async (client) => {
    if (!user?.email || !client.phone) {
      alert('❌ Klient nie ma numeru telefonu');
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

  const handleSendSMSToAll = async () => {
    if (!user?.email) {
      alert('❌ Nie jesteś zalogowany');
      return;
    }

    // Sprawdź czy są klienci do wysłania
    const clientsToSend = clients.filter(client => 
      client.phone && 
      client.review_code && 
      client.review_status !== 'completed'
    );

    if (clientsToSend.length === 0) {
      alert('❌ Brak klientów do wysłania wiadomości (wszyscy mają status "completed" lub brak numeru telefonu)');
      return;
    }

    if (window.confirm(`Czy chcesz wysłać SMS do wszystkich ${clientsToSend.length} klientów o statusie recenzji różnym od "completed"?`)) {
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
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
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

        {/* Przycisk wysyłania do wszystkich klientów */}
        {clients.length > 0 && (
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
            <div className="clients-table-container">
              <table className="clients-table">
                <thead>
                  <tr>
                    <th>Imię</th>
                    <th>Telefon</th>
                    <th>Notatka</th>
                    <th>Ocena</th>
                    <th>Recenzja</th>
                    <th>Data utworzenia</th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="client-row">
                      <td className="client-name">
                        <strong>{client.name}</strong>
                      </td>
                      <td className="client-phone">
                        {client.phone || '-'}
                      </td>
                      <td className="client-note">
                        {client.note ? (
                          <span className="note-text" title={client.note}>
                            {client.note.length > 50 
                              ? `${client.note.substring(0, 50)}...` 
                              : client.note
                            }
                          </span>
                        ) : '-'}
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
                      <td className="client-date">
                        {client.created_at ? 
                          (typeof client.created_at === 'string' 
                            ? new Date(client.created_at).toLocaleDateString('pl-PL')
                            : client.created_at.toLocaleDateString('pl-PL')
                          ) : 'Nieznana data'
                        }
                      </td>
                      <td className="client-actions">
                        <div className="action-buttons">
                          {client.phone && (
                            <button 
                              className={`action-btn sms-btn ${sendingSMS.has(client.id) ? 'loading' : ''}`}
                              onClick={() => handleSendSMS(client)}
                              disabled={sendingSMS.has(client.id)}
                              title="Wyślij SMS z linkiem do opinii"
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
                              <span className="btn-text">SMS</span>
                            </button>
                          )}
                          <button 
                            className="action-btn edit-btn"
                            onClick={() => handleEdit(client)}
                            title="Edytuj klienta"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            <span className="btn-text">Edytuj</span>
                          </button>
                          <button 
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(client.id)}
                            title="Usuń klienta"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3,6 5,6 21,6"></polyline>
                              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                              <line x1="10" x2="10" y1="11" y2="17"></line>
                              <line x1="14" x2="14" y1="11" y2="17"></line>
                            </svg>
                            <span className="btn-text">Usuń</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
