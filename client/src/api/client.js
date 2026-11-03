import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'staymate_token';

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'x-staymate-client': 'web' }
});

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // localStorage might be unavailable in some iframe/storage-disabled contexts
  }
  return config;
});

export function saveStoredToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export function clearStoredToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;
    const message =
      data?.message ||
      (error.code === 'ERR_NETWORK'
        ? 'Cannot reach the StayMate server. Please check that the backend is running.'
        : 'Something went wrong. Please try again.');
    const normalized = new Error(message);
    normalized.status = error.response?.status;
    normalized.details = data?.details;
    normalized.original = error;
    return Promise.reject(normalized);
  }
);

export function resolveImage(url) {
  if (!url) return '';
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  try {
    const apiUrl = new URL(baseURL, window.location.origin);
    return `${apiUrl.origin}${url}`;
  } catch {
    return url;
  }
}

export default api;
