/**
 * API Configuration
 * 
 * Works with Vite proxy in development and Render backend in production.
 */

import axios from 'axios';

// Base API URL
export const API_BASE =
  import.meta.env.MODE === "development"
    ? "" // Vite proxy handles /api in dev
    : import.meta.env.VITE_API_URL;

// API Endpoints
export const ENDPOINTS = {
  // Auth endpoints
  register: `${API_BASE}/api/auth/register`,
  login: `${API_BASE}/api/auth/login`,
  me: `${API_BASE}/api/auth/user`,

  // Portfolio endpoints
  portfolio: `${API_BASE}/api/portfolio`,
  buy: `${API_BASE}/api/portfolio/buy`,
  sell: `${API_BASE}/api/portfolio/sell`,
  fund: `${API_BASE}/api/portfolio/fund`,

  // Stock data endpoints
  gainers: `${API_BASE}/api/stocks/gainers`,
  losers: `${API_BASE}/api/stocks/losers`,
  allStocks: `${API_BASE}/api/stocks/all`,
  stockSearch: `${API_BASE}/api/stocks/search`,

  // Order endpoints
  orders: `${API_BASE}/api/orders`,
  orderStats: `${API_BASE}/api/orders/stats`,
};

// API Headers
export const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': localStorage.getItem('jwt_token') 
    ? `Bearer ${localStorage.getItem('jwt_token')}` 
    : '',
});

// Axios client
export const apiClient = axios.create({
  baseURL: API_BASE,
});

// Axios interceptor to attach JWT token automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});
