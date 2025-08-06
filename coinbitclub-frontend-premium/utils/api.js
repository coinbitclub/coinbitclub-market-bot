import axios from 'axios';
import Cookies from 'js-cookie';

// Configuração base da API conforme relatório de integração
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://coinbitclub-market-bot.up.railway.app'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

console.log('🔗 API Client Configuration:');
console.log('- Environment:', process.env.NODE_ENV || 'development');
console.log('- Backend URL:', API_BASE_URL);
console.log('- Integration Status: ACTIVE');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Interceptador para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log para debug (remover em produção)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptador para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    // Log para debug (remover em produção)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    
    // Tratar erro de autenticação
    if (error.response?.status === 401) {
      Cookies.remove('auth_token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    // Tratar erro de rede
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
      console.error('🌐 Network Error - Backend may be offline');
    }
    
    return Promise.reject(error);
  }
);

// Funções utilitárias para diferentes tipos de requisições
export const apiUtils = {
  // GET request
  get: async (url, config = {}) => {
    try {
      const response = await api.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // POST request
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // PUT request
  put: async (url, data = {}, config = {}) => {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // DELETE request
  delete: async (url, config = {}) => {
    try {
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Test backend connection
  testConnection: async () => {
    try {
      const endpoints = ['/health', '/api/health', '/api/status'];
      const results = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);
          results.push({
            endpoint,
            status: 'success',
            data: response.data
          });
        } catch (error) {
          results.push({
            endpoint,
            status: 'error',
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      throw error;
    }
  }
};

export default api;
