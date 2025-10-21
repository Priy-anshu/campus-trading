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
  register: `${API_BASE}/auth/register`,
  login: `${API_BASE}/auth/login`,
  me: `${API_BASE}/auth/user`,

  // Portfolio endpoints
  portfolio: `${API_BASE}/portfolio`,
  buy: `${API_BASE}/portfolio/buy`,
  sell: `${API_BASE}/portfolio/sell`,
  fund: `${API_BASE}/portfolio/fund`,

  // Stock data endpoints
  gainers: `${API_BASE}/stocks/gainers`,
  losers: `${API_BASE}/stocks/losers`,
  allStocks: `${API_BASE}/stocks/all`,
  stockSearch: `${API_BASE}/stocks/search`,

  // Order endpoints
  orders: `${API_BASE}/orders`,
  orderStats: `${API_BASE}/orders/stats`,
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
