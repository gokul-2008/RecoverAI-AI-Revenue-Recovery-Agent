import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/$/, '');
  }

  // When compiling for production (import.meta.env.PROD is true during vite build), default to live Render backend
  if (import.meta.env.PROD) {
    return 'https://recover-ai-47t6.onrender.com/api';
  }

  // Client-side fallback if window object exists on a non-localhost host
  if (typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://recover-ai-47t6.onrender.com/api';
  }

  return 'http://localhost:5000/api';
};

const API_BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT token if authenticated
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('recoverai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle session expiration / 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and user session on 401 unauthorized
      localStorage.removeItem('recoverai_token');
      localStorage.removeItem('recoverai_user');
    }
    return Promise.reject(error);
  }
);

export default api;

