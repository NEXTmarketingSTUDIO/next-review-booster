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


  return (
    <div className="clients-page">
      <div className="container">
        <div className="clients-header">
          <h1>Klienci</h1>
          <p>Zarządzaj swoją bazą klientów</p>
        </div>

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

        {/* Lista klientów */}
        <div className="clients-content">
          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Ładowanie klientów...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
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
                    <th>Data dodania</th>
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
                        {client.updated_at ? 
                          (typeof client.updated_at === 'string' 
                            ? new Date(client.updated_at).toLocaleDateString('pl-PL')
                            : client.updated_at.toLocaleDateString('pl-PL')
                          ) : 'Nieznana data'
                        }
                      </td>
                      <td className="client-actions">
                        {client.phone && (
                          <button 
                            className={`btn-icon sms ${sendingSMS.has(client.id) ? 'loading' : ''}`}
                            onClick={() => handleSendSMS(client)}
                            disabled={sendingSMS.has(client.id)}
                            title="Wyślij SMS z linkiem do opinii"
                          >
                            {sendingSMS.has(client.id) ? '⏳' : '📱'}
                          </button>
                        )}
                        <button 
                          className="btn-icon edit"
                          onClick={() => handleEdit(client)}
                          title="Edytuj klienta"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-icon delete"
                          onClick={() => handleDelete(client.id)}
                          title="Usuń klienta"
                        >
                          🗑️
                        </button>
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
      >
        <span className="add-icon">+</span>
      </button>
    </div>
  );
};

export default ClientsPage;
