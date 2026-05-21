// filepath: front-end/src/services/api.js
import axios from 'axios';

const log = (...args) => import.meta.env.DEV && console.log(...args);
const logError = (...args) => import.meta.env.DEV && console.error(...args);

const BASE_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'https://backend-ovbc.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Important pour CORS avec credentials
  timeout: 60000, // ✅ 60 secondes - laisser le temps à Render de se réveiller (cold start)
});

// Intercepteur pour les requêtes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (import.meta.env.DEV) {
      console.log(`📤 [${config.method?.toUpperCase()}] ${config.url}`, {
        headers: config.headers,
      });
    }
    
    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('Erreur requête:', error);
    }
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`📥 [${response.status}] ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    // Gérer les erreurs CORS et autres
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      if (import.meta.env.DEV) {
        console.error('❌ ERREUR RÉSEAU / CORS:', {
          message: error.message,
          config: error.config,
          code: error.code,
        });
      }
    }

    // Timeout error
    if (error.code === 'ECONNABORTED') {
      if (import.meta.env.DEV) {
        console.error('⏱️ TIMEOUT (60s dépassé):', {
          message: 'La requête a dépassé le délai de 60 secondes',
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (error.response) {
      // La requête a reçu une réponse avec un statut d'erreur
      if (error.response.status === 401) {
        // Token expiré ou invalide
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      if (import.meta.env.DEV) {
        console.error(`❌ Erreur API [${error.response.status}]`, {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
          url: error.config?.url,
        });
      }
    } else if (error.request) {
      // La requête a été faite mais pas de réponse reçue
      if (import.meta.env.DEV) {
        console.error('❌ Pas de réponse du serveur:', {
          message: error.message,
          request: error.request,
          code: error.code,
          timeout: '60000ms',
        });
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// AUTH
// ============================================
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

// ============================================
// ANNOUNCEMENTS
// ============================================
export const announcementService = {
  getAll: (params) => api.get('/announcements', { params }),
  getNearby: (lat, lng) => api.get('/announcements/nearby', { params: { lat, lng } }),
  getById: (id) => api.get(`/announcements/${id}`),
  create: (data) => {
    if (data instanceof FormData) {
      return api.post('/announcements', data);
    }
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'images') {
        data.images.forEach(image => formData.append('images', image));
      } else if (key === 'metadata') {
        formData.append(key, typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });
    return api.post('/announcements', formData);
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'images') {
        data.images?.forEach(image => formData.append('images', image));
      } else if (key === 'metadata') {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });
    return api.put(`/announcements/${id}`, formData);
  },
  delete: (id) => api.delete(`/announcements/${id}`),
  getMyAnnouncements: () => api.get('/announcements/user/my-announcements'),
  getPrices: () => api.get('/announcements/prices'),
  getSponsored: (params) => api.get('/announcements/sponsored', { params }),
  trackClick: (id, action) => api.post(`/announcements/${id}/track-click`, { action }),
  getAdvertiserDashboard: () => api.get('/announcements/advertiser/dashboard'),
  // Public endpoints (no auth headers / credentials)
  getPublicAll: (params) => axios.get(`${BASE_URL}/announcements`, { params }),
  getPublicNearby: (lat, lng) => axios.get(`${BASE_URL}/announcements/nearby`, { params: { lat, lng } }),
};

// ============================================
// PAYMENTS
// ============================================
export const paymentService = {
  create: (data) => api.post('/payment/create', data),
  verify: (transactionId) => api.post('/payment/verify', { transactionId }),
  getHistory: () => api.get('/payment/history'),
  getMethods: () => api.get('/payment/methods'),
};

// ============================================
// PRICING - Catalogue des tarifs
// ============================================
export const pricingService = {
  getAll: () => api.get('/pricing'),
  getCategory: (categoryId) => api.get(`/pricing/category/${categoryId}`),
  getOptions: () => api.get('/pricing/options'),
  calculate: (data) => api.post('/pricing/calculate', data),
  // Admin only - Update pricing
  updatePrice: (id, data) => api.put(`/pricing/${id}`, data),
};

// ============================================
// CONTACT
// ============================================
export const contactService = {
  send: (data) => api.post('/contact', data),
};

// ============================================
// REVIEWS
// ============================================
export const reviewService = {
  create: (data) => api.post('/reviews', data),
  getByUser: (userId) => api.get(`/reviews/user/${userId}`),
};

// ============================================
// REPORTS
// ============================================
export const reportService = {
  create: (data) => api.post('/reports', data),
};

// ============================================
// FAVORITES
// ============================================
export const favoriteService = {
  getAll: () => api.get('/favorites'),
  add: (announcementId) => api.post(`/favorites/${announcementId}`),
  remove: (announcementId) => api.delete(`/favorites/${announcementId}`),
};

// ============================================
// CHAT
// ============================================
export const chatService = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (conversationId) => api.get(`/chat/conversations/${conversationId}/messages`),
  createConversation: (data) => api.post('/chat/conversations', data),
  sendMessage: (data) => api.post('/chat/messages', data),
};

export default api;