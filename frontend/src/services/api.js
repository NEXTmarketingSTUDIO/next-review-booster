import axios from 'axios';

// Konfiguracja axios dla komunikacji z FastAPI
const api = axios.create({
  baseURL: '/api', // Vite proxy przekieruje to na http://localhost:8000
  timeout: 10000,
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
  }
};

export default api;
