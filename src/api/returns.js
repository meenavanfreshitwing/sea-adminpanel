// src/api/returns.js
import api from './axiosConfig';

export const returnsAPI = {
  // 🌐 Public — for frontend /returns page
  getReturnPolicy: () => api.get('/returns'),

  // 🔐 Admin
  getReturnPolicyById: (id) => api.get(`/admin/returns/${id}`),
  createReturnPolicy: (data) => api.post('/admin/returns', data),
  updateReturnPolicy: (id, data) => api.put(`/admin/returns/${id}`, data),
  deleteReturnPolicy: (id) => api.delete(`/admin/returns/${id}`),
};