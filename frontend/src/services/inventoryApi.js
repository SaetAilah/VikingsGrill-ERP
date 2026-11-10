import api from './api.js';

export const inventoryApi = {
  async getItems() {
    const res = await api.get('/inventory/items');
    return res.data;
  },

  async createItem(data) {
    const res = await api.post('/inventory/items', data);
    return res.data;
  },

  async updateItem(id, data) {
    const res = await api.put(`/inventory/items/${id}`, data);
    return res.data;
  },

  async recordAdjustment(id, data) {
    const res = await api.post(`/inventory/items/${id}/adjustments`, data);
    return res.data;
  },

  async getMovements() {
    const res = await api.get('/inventory/movements');
    return res.data;
  },

  async getSuppliers() {
    const res = await api.get('/suppliers');
    return res.data;
  },

  async createSupplier(data) {
    const res = await api.post('/suppliers', data);
    return res.data;
  },

  async getOrders() {
    const res = await api.get('/procurement/orders');
    return res.data;
  },

  async createOrder(data) {
    const res = await api.post('/procurement/orders', data);
    return res.data;
  },

  async receiveOrder(orderNo) {
    const res = await api.post(`/procurement/orders/${orderNo}/receive`);
    return res.data;
  },
};

export default inventoryApi;

