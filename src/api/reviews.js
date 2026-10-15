import api from './axiosConfig';

export const reviewsAPI = {
  list: (params = {}) => api.get('/admin/reviews', { params }),
  setStatus: (id, status) => api.patch(`/admin/reviews/${id}`, { status }),
  remove: (id) => api.delete(`/admin/reviews/${id}`),
};
