import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

  // Use envUrl if explicitly set to a full external HTTPS endpoint (not relative or vercel domain)
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    const trimmed = envUrl.trim().replace(/\/$/, '');
    if ((trimmed.startsWith('http://') || trimmed.startsWith('https://')) && !trimmed.includes('vercel.app')) {
      return trimmed;
    }
  }

  // In production mode or non-localhost web deployments, enforce Render backend
  if (import.meta.env.PROD || (typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')) {
    return 'https://recover-ai-47t6.onrender.com/api';
  }

  return 'http://localhost:5000/api';
};

const API_BASE_URL = getBaseUrl();
console.log(`[RecoverAI API] Connected to Base URL: ${API_BASE_URL}`);

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

