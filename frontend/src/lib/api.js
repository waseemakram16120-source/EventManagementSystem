import axios from 'axios';

// Single axios instance for the whole app.
// baseURL comes from VITE_API_URL when set; otherwise relative '/api' is
// used, which works with the Vite dev proxy and with the Vercel rewrites
// (/api/* -> /api/index) in production.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
