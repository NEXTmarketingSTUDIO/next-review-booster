import axios from 'axios';

// Konfiguracja axios dla komunikacji z FastAPI
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (process.env.NODE_ENV === 'production' 
    ? 'https://next-review-booster.onrender.com' 
    : '/api'), // Vite proxy przekieruje to na http://localhost:8000 w development
  timeout: 15000, // Zwiększony timeout dla Firebase
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  }
};

export default api;
