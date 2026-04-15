// src/api/axiosInstance.js
//
// In production (Vercel): requests go to /api, which vercel.json proxies
//   to https://auragram.onrender.com/api — same-origin from browser perspective.
// In development: /api is proxied by Vite to localhost:5001.
// No VITE_API_URL needed.

import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api',
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
    // Guard: config can be undefined on network errors / timeouts
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
