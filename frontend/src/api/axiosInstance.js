// src/api/axiosInstance.js
import axios from 'axios';

// In production (Vercel), requests go to /api which Vercel rewrites to Render backend.
// In development, requests go to /api which Vite proxies to localhost:5001.
// VITE_API_URL can override both if set explicitly in .env.production.
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

axiosInstance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

function processQueue(error) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
}

// URLs that should NEVER trigger a refresh attempt
const NO_REFRESH_URLS = ['/auth/refresh', '/auth/login', '/auth/register', '/auth/me'];

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If config is missing (network error, timeout) bail early
    if (!originalRequest) return Promise.reject(error);

    const url = originalRequest.url || '';

    const shouldSkipRefresh =
      error.response?.status !== 401 ||
      originalRequest._retry ||
      NO_REFRESH_URLS.some((u) => url.includes(u));

    if (shouldSkipRefresh) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => axiosInstance(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await axiosInstance.post('/auth/refresh');
      processQueue(null);
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      // Fire a custom event — let React Router handle navigation,
      // never use window.location (causes infinite reload)
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;
