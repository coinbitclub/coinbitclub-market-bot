import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await api.post('/auth/refresh')
        return api(error.config)
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  },
)

export default api

export const login = (data: { email: string; password: string }) =>
  api.post('/auth/login', data);

export const fetchPlans = () => api.get('/plans');

export const fetchCredentials = () => api.get('/credentials');

export const fetchCoinStats = () => api.get('/coinstats');

export const fetchDashboardMetrics = () => api.get('/dashboard/metrics');

export const fetchOrders = () => api.get('/orders');

export const fetchReports = (path: string) => api.get(`/reports/${path}`);

export const fetchDashboardBalances = () => api.get('/dashboard/balances');

export const fetchOpenPositions = () => api.get('/orders?status=open');

export const fetchClosedPositions = () => api.get('/orders?status=closed');

export const fetchAffiliateMetrics = () => api.get('/affiliate/metrics');

export const fetchAdminMetrics = () =>
  api.get('/admin/metrics');

export const sse = () =>
  new EventSource(`${api.defaults.baseURL}/events`);
