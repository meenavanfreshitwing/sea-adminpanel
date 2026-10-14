// src/api/shipping.js
import api from './axiosConfig';

export const shippingAPI = {
  // 🌐 Public — for frontend /shipping page
  getShipping: () => api.get('/shipping'),

  // 🔐 Admin
  getShippingById: (id) => api.get(`/admin/shipping/${id}`),
  createShipping: (data) => api.post('/admin/shipping', data),
  updateShipping: (id, data) => api.put(`/admin/shipping/${id}`, data),
  deleteShipping: (id) => api.delete(`/admin/shipping/${id}`),
};