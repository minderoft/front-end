// filepath: front-end/src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';
const BASE_URL = API_URL
  ? API_URL.replace(/\/$/, '') + (API_URL.endsWith('/api') ? '' : '/api')
  : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
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
  getById: (id) => api.get(`/announcements/${id}`),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'images') {
        data.images.forEach(image => formData.append('images', image));
      } else if (key === 'metadata') {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });
    return api.post('/announcements', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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
    return api.put(`/announcements/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id) => api.delete(`/announcements/${id}`),
  getMyAnnouncements: () => api.get('/announcements/user/my-announcements'),
  getPrices: () => api.get('/announcements/prices'),
};

// ============================================
// PAYMENTS
// ============================================
export const paymentService = {
  create: (data) => api.post('/payments/create', data),
  verify: (transactionId) => api.post('/payments/verify', { transactionId }),
  getHistory: () => api.get('/payments/history'),
  getMethods: () => api.get('/payments/methods'),
};

// ============================================
// PRICING - Catalogue des tarifs
// ============================================
export const pricingService = {
  getAll: () => api.get('/pricing'),
  getCategory: (categoryId) => api.get(`/pricing/category/${categoryId}`),
  getOptions: () => api.get('/pricing/options'),
  calculate: (data) => api.post('/pricing/calculate', data),
};

// ============================================
// CONTACT
// ============================================
export const contactService = {
  send: (data) => api.post('/contact', data),
};

export default api;