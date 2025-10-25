/**
 * API Configuration
 * 
 * This file contains all API endpoints and configuration.
 * Currently using mock data, but ready for backend integration.
 */

// Base API URL - proxied by Vite to backend at http://localhost:4000
export const API_BASE = import.meta.env.VITE_API_URL || '';

// API Endpoints
export const ENDPOINTS = {
  // Auth endpoints
  register: `/auth/register`,
  login: `/auth/login`,
  me: `/auth/user`,

  // Portfolio endpoints
  portfolio: `/portfolio`,
  buy: `/portfolio/buy`,
  sell: `/portfolio/sell`,
  fund: `/portfolio/fund`,

  // Stock data endpoints
  gainers: `/stocks/gainers`,
  losers: `/stocks/losers`,
  allStocks: `/stocks/all`,
  stockSearch: `/stocks/search`,
  stockPrice: `/stocks/price`,

  // Order endpoints
  orders: `/orders`,
  orderStats: `/orders/stats`,

  // Leaderboard endpoints
  leaderboard: `/leaderboard`,
  leaderboardRank: `/leaderboard/rank`,

  // Auth endpoints for profile
  changePassword: `/auth/change-password`,
};

// API Headers
export const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': localStorage.getItem('jwt_token') ? `Bearer ${localStorage.getItem('jwt_token')}` : '',
});

// Helper function for making API calls (to be implemented)
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: API_BASE || '/api',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});
