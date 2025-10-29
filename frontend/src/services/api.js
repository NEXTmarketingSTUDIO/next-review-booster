import axios from 'axios';

// Konfiguracja axios dla komunikacji z FastAPI
const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.PROD 
  ? 'https://next-review-booster.onrender.com' 
  : '/api');

console.log('🔧 API Config:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  PROD: import.meta.env.PROD,
  baseURL: baseURL,
  NODE_ENV: import.meta.env.MODE,
  MODE: import.meta.env.MODE
});

const api = axios.create({
  baseURL: baseURL,
  timeout: 60000, // Zwiększony timeout dla Firebase (60 sekund)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dodaj interceptor do obsługi błędów (wyłączone debugowanie)
api.interceptors.request.use(
  (config) => {
    // Logowanie tylko w trybie deweloperskim
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true') {
      console.log('🚀 API Request:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Logowanie tylko w trybie deweloperskim
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true') {
      console.log('✅ API Response:', response.config.url);
    }
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor dla requestów - dodaje token autoryzacji jeśli istnieje
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor dla odpowiedzi - obsługuje błędy
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token wygasł lub nieprawidłowy
      localStorage.removeItem('token');
      // Można dodać przekierowanie na stronę logowania
    }
    return Promise.reject(error);
  }
);

// Funkcje API dla różnych endpointów
export const apiService = {
  // Health check endpoint
  async getHealth() {
    const response = await api.get('/health');
    return response.data;
  },

  // Przykładowe endpointy - dostosuj do swojego FastAPI
  async getReviews() {
    const response = await api.get('/reviews');
    return response.data;
  },

  async getReview(id) {
    const response = await api.get(`/reviews/${id}`);
    return response.data;
  },

  async createReview(reviewData) {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  async updateReview(id, reviewData) {
    const response = await api.put(`/reviews/${id}`, reviewData);
    return response.data;
  },

  async deleteReview(id) {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  },

  // Endpointy dla użytkowników
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Endpointy dla produktów/usług
  async getProducts() {
    const response = await api.get('/products');
    return response.data;
  },

  async getProduct(id) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Endpointy dla klientów
  async getClients(username) {
    console.log('🌐 API: Pobieranie klientów dla:', username);
    try {
      const response = await api.get(`/clients/${username}`);
      console.log('✅ API: Odpowiedź otrzymana:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Błąd pobierania klientów:', error);
      throw error;
    }
  },

  async getClient(username, clientId) {
    const response = await api.get(`/clients/${username}/${clientId}`);
    return response.data;
  },

  async createClient(username, clientData) {
    const response = await api.post(`/clients/${username}`, clientData);
    return response.data;
  },

  async updateClient(username, clientId, clientData) {
    const response = await api.put(`/clients/${username}/${clientId}`, clientData);
    return response.data;
  },

  async deleteClient(username, clientId) {
    const response = await api.delete(`/clients/${username}/${clientId}`);
    return response.data;
  },

  // Endpointy dla ustawień użytkownika
  async getUserSettings(username) {
    console.log('⚙️ API: Pobieranie ustawień dla:', username);
    try {
      const response = await api.get(`/settings/${username}`);
      console.log('✅ API: Ustawienia otrzymane:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Błąd pobierania ustawień:', error);
      throw error;
    }
  },

  async saveUserSettings(username, settings) {
    console.log('💾 API: Zapisywanie ustawień dla:', username);
    try {
      const response = await api.put(`/settings/${username}`, settings);
      console.log('✅ API: Ustawienia zapisane:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Błąd zapisywania ustawień:', error);
      throw error;
    }
  },

  // Endpointy dla kodów QR
  async generateCompanyQRCode(username, size = 200) {
    console.log('🔲 API: Generowanie kodu QR dla firmy:', username);
    try {
      const response = await api.post(`/qrcode/${username}`, {
        size: size,
        format: 'png'
      });
      console.log('✅ API: Kod QR wygenerowany:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Błąd generowania kodu QR:', error);
      throw error;
    }
  },

  async getQRCodeImage(reviewCode, size = 200) {
    console.log('🔲 API: Pobieranie obrazu kodu QR dla:', reviewCode);
    try {
      const response = await api.get(`/qrcode/${reviewCode}?size=${size}`, {
        responseType: 'blob'
      });
      console.log('✅ API: Obraz kodu QR pobrany');
      return response.data;
    } catch (error) {
      console.error('❌ API: Błąd pobierania obrazu kodu QR:', error);
      throw error;
    }
  },

  // Endpoint dla logowania klienta
  async clientLogin(username, clientData) {
    console.log('👤 API: Logowanie klienta:', username);
    try {
      const response = await api.post(`/client-login/${username}`, clientData);
      console.log('✅ API: Klient zalogowany:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Błąd logowania klienta:', error);
      throw error;
    }
  },

  // Endpointy dla SMS
  async sendSMS(username, clientId) {
    console.log('📱 API: Wysyłanie SMS dla:', username, clientId);
    try {
      const response = await api.post(`/send-sms/${username}/${clientId}`);
      console.log('✅ API: SMS wysłany:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Błąd wysyłania SMS:', error);
      throw error;
    }
  },

  async sendSMSDirect(username, toPhone, message, clientName = '') {
    console.log('📱 API: Bezpośrednie wysyłanie SMS do:', toPhone);
    try {
      const response = await api.post(`/send-sms-direct/${username}`, {
        to_phone: toPhone,
        message: message,
        client_name: clientName
      });
      console.log('✅ API: SMS wysłany bezpośrednio:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Błąd wysyłania SMS bezpośrednio:', error);
      throw error;
    }
  },

  // Endpoint do wysyłania SMS do wszystkich klientów
  async sendSMSToAllClients(username) {
    console.log('📱 API: Wysyłanie SMS do wszystkich klientów dla:', username);
    try {
      const response = await api.post(`/send-sms-all/${username}`);
      console.log('✅ API: SMS do wszystkich klientów wysłany:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Błąd wysyłania SMS do wszystkich klientów:', error);
      throw error;
    }
  },

  async getUserStatistics(username) {
    console.log('📊 API: Pobieranie statystyk dla:', username);
    try {
      const response = await api.get(`/statistics/${username}`);
      console.log('✅ API: Statystyki pobrane:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Błąd pobierania statystyk:', error);
      throw error;
    }
  },

  // Endpoint dla formularza kontaktowego
  async submitContactForm(contactData) {
    console.log('📧 API: Wysyłanie formularza kontaktowego:', contactData);
    try {
      const response = await api.post('/contact', contactData);
      console.log('✅ API: Formularz kontaktowy wysłany:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Błąd wysyłania formularza kontaktowego:', error);
      throw error;
    }
  },

  async get(url) {
    console.log('🌐 API: GET request:', url);
    try {
      const response = await api.get(url);
      console.log('✅ API: GET response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ API: GET error:', error);
      throw error;
    }
  },

  async post(url, data) {
    console.log('🌐 API: POST request:', url, data);
    try {
      const response = await api.post(url, data);
      console.log('✅ API: POST response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ API: POST error:', error);
      throw error;
    }
  },

  async put(url, data) {
    console.log('🌐 API: PUT request:', url, data);
    try {
      const response = await api.put(url, data);
      console.log('✅ API: PUT response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ API: PUT error:', error);
      throw error;
    }
  },

  async delete(url) {
    console.log('🌐 API: DELETE request:', url);
    try {
      const response = await api.delete(url);
      console.log('✅ API: DELETE response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ API: DELETE error:', error);
      throw error;
    }
  },

  // Funkcje związane z uprawnieniami
  async getUserPermissionByEmail(email) {
    console.log('🔐 API: Pobieranie uprawnień dla email:', email);
    try {
      const response = await api.get(`/user-permission-by-email/${email}`);
      console.log('✅ API: Uprawnienia pobrane:', response.data);
      return {
        success: true,
        permission: response.data.permission,
        username: response.data.username
      };
    } catch (error) {
      console.error('❌ API: Błąd pobierania uprawnień:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Błąd pobierania uprawnień'
      };
    }
  },

  // Funkcje administratora
  async getAllUsers() {
    console.log('👥 API: Pobieranie wszystkich użytkowników');
    try {
      const response = await api.get('/admin/users');
      console.log('✅ API: Użytkownicy pobrani:', response.data);
      return {
        success: true,
        users: response.data.users,
        total: response.data.total
      };
    } catch (error) {
      console.error('❌ API: Błąd pobierania użytkowników:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Błąd pobierania użytkowników'
      };
    }
  },

  async updateUserPermission(username, permissionData) {
    console.log('🔐 API: Aktualizacja uprawnień:', { username, permissionData });
    try {
      const response = await api.put(`/admin/users/${username}/permission`, permissionData);
      console.log('✅ API: Uprawnienia zaktualizowane:', response.data);
      return {
        success: true,
        permission: response.data.permission,
        smsLimit: response.data.smsLimit,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ API: Błąd aktualizacji uprawnień:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Błąd aktualizacji uprawnień'
      };
    }
  },

  async updateUserTwilio(username, twilioData) {
    console.log('📱 API: Aktualizacja Twilio:', { username, twilioData });
    try {
      const response = await api.put(`/admin/users/${username}/twilio`, twilioData);
      console.log('✅ API: Twilio zaktualizowane:', response.data);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ API: Błąd aktualizacji Twilio:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Błąd aktualizacji Twilio'
      };
    }
  },

  // Powiadomienia
  async getNotifications(userEmail) {
    console.log('🔔 API: Pobieranie powiadomień:', userEmail);
    try {
      const response = await api.get(`/notifications/${encodeURIComponent(userEmail)}`);
      console.log('✅ API: Powiadomienia pobrane:', response.data);
      return {
        success: true,
        notifications: response.data.notifications || []
      };
    } catch (error) {
      console.error('❌ API: Błąd pobierania powiadomień:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Błąd pobierania powiadomień',
        notifications: []
      };
    }
  },

  async markNotificationAsRead(userEmail, notificationId) {
    console.log('📖 API: Oznaczanie powiadomienia jako przeczytane:', { userEmail, notificationId });
    try {
      const response = await api.put(`/notifications/${encodeURIComponent(userEmail)}/${notificationId}/read`);
      console.log('✅ API: Powiadomienie oznaczone jako przeczytane:', response.data);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ API: Błąd oznaczania powiadomienia:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Błąd oznaczania powiadomienia'
      };
    }
  },

  async markAllNotificationsAsRead(userEmail) {
    console.log('📖 API: Oznaczanie wszystkich powiadomień jako przeczytane:', userEmail);
    try {
      const response = await api.put(`/notifications/${encodeURIComponent(userEmail)}/read-all`);
      console.log('✅ API: Wszystkie powiadomienia oznaczone jako przeczytane:', response.data);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ API: Błąd oznaczania wszystkich powiadomień:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Błąd oznaczania wszystkich powiadomień'
      };
    }
  }

};

export default apiService;
