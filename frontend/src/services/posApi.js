import api from './api.js';

export const posApi = {
  async getMenu() {
    const res = await api.get('/menu');
    return res.data;
  },

  async createMenuItem(data) {
    const res = await api.post('/menu', data);
    return res.data;
  },

  async updateMenuItem(id, data) {
    const res = await api.put(`/menu/${id}`, data);
    return res.data;
  },

  async deleteMenuItem(id) {
    const res = await api.delete(`/menu/${id}`);
    return res.data;
  },

  async getSales() {
    const res = await api.get('/sales');
    return res.data;
  },

  async createSale(data) {
    const res = await api.post('/sales', data);
    return res.data;
  },

  async getTables() {
    const res = await api.get('/tables');
    return res.data;
  },

  async updateTableStatus(id, status) {
    const res = await api.patch(`/tables/${id}/status`, { status });
    return res.data;
  },
};

export default posApi;

