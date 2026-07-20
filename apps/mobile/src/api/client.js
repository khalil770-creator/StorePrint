import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { useAuthStore } from '../store/authStore';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 → auto refresh
client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
        useAuthStore.getState().setTokens(data.tokens.access, data.tokens.refresh);
        original.headers.Authorization = `Bearer ${data.tokens.access}`;
        return client(original);
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(err);
  }
);

export default client;
