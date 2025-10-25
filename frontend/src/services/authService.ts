import { apiClient } from '@/api/config';
const API_BASE_URL = '/auth';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  mobileNumber: string;
  dateOfBirth: string;
  gender: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    mobileNumber: string;
    dateOfBirth: string;
    gender: string;
  };
}

// Store JWT token in localStorage
export const setToken = (token: string): void => {
  localStorage.setItem('jwt_token', token);
};

// Retrieve JWT token from localStorage
export const getToken = (): string | null => {
  return localStorage.getItem('jwt_token');
};

// Remove JWT token (logout)
export const removeToken = (): void => {
  localStorage.removeItem('jwt_token');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Login API call
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>(`${API_BASE_URL}/login`, credentials);
  setToken(data.token);
  return data;
};

// Signup API call
export const signup = async (credentials: SignupCredentials): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>(`${API_BASE_URL}/register`, credentials);
  setToken(data.token);
  return data;
};

// Logout
export const logout = (): void => {
  removeToken();
};

// Get Authorization header with JWT token
export const getAuthHeader = (): { Authorization: string } | {} => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Example: How to use JWT in API calls
export const authenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const res = await apiClient({ url, method: (options.method as any) || 'GET' });
  return res;
};
