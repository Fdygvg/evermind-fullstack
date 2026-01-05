import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
});

// Add token to requests automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('evermind_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiry
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('evermind_token');
      localStorage.removeItem('evermind_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;