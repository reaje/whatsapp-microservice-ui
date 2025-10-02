import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL, AUTH_TOKEN_KEY, CLIENT_ID_KEY } from '@/utils/constants';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const clientId = localStorage.getItem(CLIENT_ID_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (clientId) {
      config.headers['X-Client-Id'] = clientId;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(CLIENT_ID_KEY);
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export interface ApiError {
  message: string;
  status: number;
  data?: any;
}

export function handleApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    return {
      message: error.response?.data?.error || error.message,
      status: error.response?.status || 500,
      data: error.response?.data,
    };
  }

  return {
    message: 'Ocorreu um erro desconhecido',
    status: 500,
  };
}
