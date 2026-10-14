// api/users.js
import api from './axiosConfig';

export const userAPI = {
  // ============ USER PROFILE ============
  
  // Get current user profile
  getProfile: () => api.get('/api/auth/profile'),
  
  // Update current user profile
  updateProfile: (userData) => api.put('/api/auth/profile', userData),
  
  // ============ ADMIN USER MANAGEMENT ============
  
  // Get all users (Admin only)
  getAllUsers: (params = {}) => {
    const { page = 1, limit = 20, role, isActive, search, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    if (role && role !== 'all') queryParams.append('role', role);
    if (isActive !== undefined && isActive !== '') queryParams.append('isActive', isActive);
    if (search) queryParams.append('search', search);
    if (sortBy) queryParams.append('sortBy', sortBy);
    if (sortOrder) queryParams.append('sortOrder', sortOrder);
    
    return api.get(`/api/admin/users?${queryParams.toString()}`);
  },
  
  // Get user statistics (Admin only)
  getUserStats: () => api.get('/api/admin/users/stats'),
  
  // Get user by ID (Admin only)
  getUserById: (userId) => api.get(`/api/admin/users/${userId}`),
  
  // Update user (Admin only)
  updateUser: (userId, userData) => api.put(`/api/admin/users/${userId}`, userData),
  
  // Delete user (Admin only) - soft delete (deactivate)
  deleteUser: (userId, permanent = false) => api.delete(`/api/admin/users/${userId}?permanent=${permanent}`),
  
  // Restore soft-deleted user (Admin only)
  restoreUser: (userId) => api.patch(`/api/admin/users/${userId}/restore`),
  
  // Create admin user (Admin only)
  createAdminUser: (userData) => api.post('/api/admin/users/create-admin', userData),
  
  // Bulk actions (Admin only)
  bulkUserAction: (userIds, action) => api.post('/api/admin/users/bulk-action', { userIds, action }),
};

export default userAPI;