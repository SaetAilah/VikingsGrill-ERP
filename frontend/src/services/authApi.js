import api, { SESSION_TOKEN_KEY } from './api.js';

export const authApi = {
  async register(data) {
    const res = await api.post('/auth/register', data);
    if (res.data?.token) {
      localStorage.setItem(SESSION_TOKEN_KEY, res.data.token);
    }
    return res.data;
  },

  async login(data) {
    const res = await api.post('/auth/login', data);
    if (res.data?.token) {
      localStorage.setItem(SESSION_TOKEN_KEY, res.data.token);
    }
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  },

  async getUsers() {
    const res = await api.get('/users');
    return res.data;
  },

  async updateUserRole(id, role) {
    const res = await api.put(`/users/${id}/role`, { role });
    return res.data;
  },
};

export default authApi;

