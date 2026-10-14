import api from './axiosConfig';

export const settingsAPI = {
  // Get all settings (Admin)
  getAllSettings: () => api.get('/admin/settings'),
  
  // Update settings (Admin)
  updateSettings: (data) => api.put('/admin/settings', data),
  
  // Get public settings (No auth needed)
  getPublicSettings: () => api.get('/settings/public'),
};