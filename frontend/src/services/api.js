import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 20000 });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('wanderly_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use((r) => r, (e) => {
  const url = e.config?.url || '';
  if (e.response?.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/setup')) {
    localStorage.removeItem('wanderly_token');
    if (!location.hash.includes('/login')) location.hash = '#/login';
  }
  return Promise.reject(e);
});
export const unwrap = (p) => p.then((r) => r.data.data);
export const errMsg = (e) => e.response?.data?.message || (e.code === 'ECONNABORTED' ? 'The request timed out.' : e.message) || 'Something went wrong';
export default api;
