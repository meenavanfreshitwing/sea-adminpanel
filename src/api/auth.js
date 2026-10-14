// src/api/auth.js
import api from './axiosConfig';

export const authAPI = {
  // Admin login (email + password)
  adminLogin: (data) => api.post('/auth/admin/login', data),
  
  // User login (OTP based)
  sendOTP: (data) => api.post('/auth/send-otp', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  
  // Common
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
};