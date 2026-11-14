// src/api/addons.js — add-ons (masala etc.) offered at checkout
import api from './axiosConfig';

export const addonsAPI = {
  // Categories (Marination, Curry Masala, Ready-to-Cook Kits…)
  listCategories: () => api.get('/admin/addon-categories'),
  createCategory: (data) => api.post('/admin/addon-categories', data),
  updateCategory: (id, data) => api.put(`/admin/addon-categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/addon-categories/${id}`),

  // Add-ons — create/update take FormData (photo) or a plain object (e.g. { isActive })
  list: () => api.get('/admin/addons'),
  create: (formData) => api.post('/admin/addons', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => (data instanceof FormData
    ? api.put(`/admin/addons/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
    : api.put(`/admin/addons/${id}`, data)),
  remove: (id) => api.delete(`/admin/addons/${id}`),
};

// R2 key → full image URL
export const addonImageUrl = (image) => {
  if (!image) return null;
  return image.startsWith('http') ? image : `${import.meta.env.VITE_R2_PUBLIC_URL}/${image}`;
};
