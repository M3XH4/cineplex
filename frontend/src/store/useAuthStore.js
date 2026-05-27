import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create an axios instance
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken }, { withCredentials: true });
        if (res.data.success) {
          const { accessToken, refreshToken: newRefreshToken } = res.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch {
        // Refresh token failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      set({ user, accessToken, isAuthenticated: true, loading: false });
      return { success: true, role: user.role };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { accessToken, refreshToken, user } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      set({ user, accessToken, isAuthenticated: true, loading: false });
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  googleLogin: async (googlePayload) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/google', googlePayload);
      const { accessToken, refreshToken, user } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      set({ user, accessToken, isAuthenticated: true, loading: false });
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Google login failed';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      if (import.meta.env.DEV) console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },

  getMe: async () => {
    if (!localStorage.getItem('accessToken')) return;
    set({ loading: true });
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data.user, isAuthenticated: true, loading: false });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, accessToken: null, isAuthenticated: false, loading: false });
    }
  },
}));
