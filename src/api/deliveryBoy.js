// src/api/deliveryBoy.js
import api from './axiosConfig';

export const deliveryBoyAPI = {
  // ============ DELIVERY BOY PANEL (LOGIN REQUIRED) ============
  
  // Delivery boy login
  login: (credentials) => api.post('/delivery/login', credentials),
  
  // Get delivery boy profile
  getProfile: () => api.get('/delivery/profile'),
  
  // Update delivery boy profile (vehicle, password)
  updateProfile: (profileData) => api.put('/delivery/profile', profileData),
  
  // Get dashboard stats (today deliveries, pending, total)
  getStats: () => api.get('/delivery/stats'),
  
  // Get current assigned orders (pending + picked up)
  getMyOrders: () => api.get('/delivery/orders'),
  
  // Get delivery history (delivered orders)
  getOrderHistory: () => api.get('/delivery/orders/history'),
  
  // Get single order details
  getOrderDetails: (orderId) => api.get(`/delivery/orders/${orderId}`),
  
  // Mark order as picked up
  markPickedUp: (orderId) => api.put(`/delivery/orders/${orderId}/pickup`),
  
  // Mark order as delivered
  markDelivered: (orderId) => api.put(`/delivery/orders/${orderId}/deliver`),
    markCodPaid: (orderId) => api.put(`/delivery/orders/${orderId}/mark-paid`),

  
  // ============ ADMIN DELIVERY BOY MANAGEMENT ============
  
  // Get all delivery boys (Admin only)
  getAllDeliveryBoys: (params = {}) => {
    const { search, status, page = 1, limit = 20 } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    if (search) queryParams.append('search', search);
    if (status && status !== 'all') queryParams.append('status', status);
    
    return api.get(`/admin/delivery-boys?${queryParams.toString()}`);
  },
  
  // Get single delivery boy by ID (Admin only)
  getDeliveryBoyById: (id) => api.get(`/admin/delivery-boys/${id}`),
  
  // Add new delivery boy (Admin only)
  addDeliveryBoy: (data) => api.post('/admin/delivery-boys', data),
  
  // Update delivery boy (Admin only)
  updateDeliveryBoy: (id, data) => api.put(`/admin/delivery-boys/${id}`, data),
  
  // Delete delivery boy (Admin only)
  deleteDeliveryBoy: (id) => api.delete(`/admin/delivery-boys/${id}`),
  
  // Get wards list for dropdown (Admin only)
  getWardsList: () => api.get('/admin/wards'),
  
  // Get unassigned orders (Admin only)
  getUnassignedOrders: () => api.get('/admin/orders/unassigned'),
  
  // Manually assign order to delivery boy (Admin only)
  assignOrderToDeliveryBoy: (orderId, deliveryBoyId) => 
    api.post('/admin/orders/assign', { orderId, deliveryBoyId }),
  
  // ✅ FIXED: Get delivery boy stats by ID (Admin only)
  getDeliveryBoyStats: (id) => api.get(`/admin/delivery-boys/${id}/stats`),
  
  // ✅ ADD THIS: Get delivery boy orders with filters (Admin only)
  getDeliveryBoyOrders: (id, params = {}) => {
    const { status, page = 1, limit = 20 } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    if (status && status !== 'all') queryParams.append('status', status);
    
    return api.get(`/admin/delivery-boys/${id}/orders?${queryParams.toString()}`);
  },
  
  // Get delivery boy stats for dashboard overview (Admin only)
  getDeliveryBoyStatsOverview: () => api.get('/admin/delivery/stats'),
};

export default deliveryBoyAPI;