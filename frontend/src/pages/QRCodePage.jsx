import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import useAuth from '../hooks/useAuth';
import './QRCodePage.css';

const QRCodePage = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [qrSize, setQrSize] = useState(200);

  // Debugowanie stanu użytkownika
  useEffect(() => {
    console.log('QRCodePage - Stan użytkownika:', user);
    console.log('QRCodePage - Email użytkownika:', user?.email);
  }, [user]);

  useEffect(() => {
    if (user?.email) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      const username = user.email.split('@')[0];
      const response = await apiService.getClients(username);
      setClients(response.clients || []);
    } catch (error) {
      console.error('Błąd podczas pobierania klientów:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (clientId) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clients.map(client => client.id));
    }
  };

  const generateQRCodes = async () => {
    if (!user?.email) {
      console.error('Użytkownik nie jest zalogowany');
      alert('Musisz być zalogowany, aby generować kody QR');
      return;
    }
    
    try {
      setGenerating(true);
      const username = user.email.split('@')[0];
      console.log('Generowanie kodu QR dla użytkownika:', username);
      
      const data = await apiService.generateCompanyQRCode(username, qrSize);
      console.log('Dane odpowiedzi:', data);
      
      setQrCodes([{
        qr_code: data.qr_code,
        company_name: data.company_name,
        review_url: data.review_url,
        qr_size: qrSize
      }]);
    } catch (error) {
      console.error('Błąd podczas generowania kodu QR:', error);
      alert(`Wystąpił błąd podczas generowania kodu QR: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const printQRCodes = () => {
    window.print();
  };

  const downloadQRCode = (qrCode, clientName) => {
    const link = document.createElement('a');
    link.href = qrCode.qr_code;
    link.download = `qr_${clientName.replace(/\s+/g, '_')}.png`;
    link.click();
  };

  if (loading) {
    return (
      <div className="qr-page">
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Ładowanie klientów...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-page">
      <div className="container">

        {/* Panel główny - ustawienia i kod QR obok siebie */}
        <div className="qr-main-content">
          {/* Panel ustawień */}
          <div className="qr-controls">
            <div className="qr-settings">
              <h3>Generuj kod QR dla firmy</h3>
              <p>Kod QR będzie kierował klientów do formularza logowania, gdzie będą mogli podać swoje dane i przejść do formularza opinii.</p>
              
              <div className="setting-group">
                <label htmlFor="qrSize">Rozmiar kodu QR:</label>
                <select 
                  id="qrSize" 
                  value={qrSize} 
                  onChange={(e) => setQrSize(parseInt(e.target.value))}
                >
                  <option value={150}>Mały (150px)</option>
                  <option value={200}>Średni (200px)</option>
                  <option value={300}>Duży (300px)</option>
                  <option value={400}>Bardzo duży (400px)</option>
                </select>
              </div>
              
              <button 
                className="btn btn-primary"
                onClick={generateQRCodes}
                disabled={generating}
              >
                {generating ? 'Generowanie...' : 'Generuj kod QR'}
              </button>
            </div>
          </div>

          {/* Wyświetlanie kodu QR obok panelu */}
          {qrCodes.length > 0 && (
            <div className="qr-display">
              <div className="qr-display-header">
                <h3>Wygenerowany kod QR</h3>
              </div>
              
              <div className="qr-preview">
                {qrCodes.map((qrCode, index) => (
                  <div key={index} className="qr-preview-card">
                    <div className="qr-image">
                      <img 
                        src={qrCode.qr_code} 
                        alt={`QR Code for ${qrCode.company_name}`}
                        style={{ width: qrSize, height: qrSize }}
                      />
                    </div>
                    <div className="qr-info">
                      <h4>{qrCode.company_name}</h4>
                      <p className="qr-url">{qrCode.review_url}</p>
                      <p className="qr-description">Kod QR kieruje klientów do formularza logowania</p>
                      <button 
                        className="btn btn-small"
                        onClick={() => downloadQRCode(qrCode, qrCode.company_name)}
                      >
                        <i data-feather="download"></i> Pobierz
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodePage;
