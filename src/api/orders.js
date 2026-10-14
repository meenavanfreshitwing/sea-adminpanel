// services/ordersAPI.js
import api from './axiosConfig';

export const ordersAPI = {
  // ========== USER ROUTES ==========
  createOrder: (orderData) => api.post('/orders', orderData),
  getUserOrders: () => api.get('/orders/my-orders'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id, cancelData = {}) => api.put(`/orders/${id}/cancel`, cancelData),
  printOrderReceipt: (id) => api.get(`/orders/${id}/receipt`),
  printOrderReceiptPDF: (orderId, config = {}) =>
    api.get(`/orders/${orderId}/receipt/pdf`, config),

  // ========== ADMIN ROUTES ==========
  getOrders: (params = {}) => api.get('/admin/orders', { params }),
  getOrderStats: () => api.get('/admin/orders/stats'),
  getOrderSummary: () => api.get('/admin/orders/stats'),
  updateOrderStatus: (id, statusData) => api.patch(`/admin/orders/${id}/status`, statusData),
  getAdminOrderById: (id) => api.get(`/admin/orders/${id}`),
  deleteOrder: (id) => api.delete(`/admin/orders/${id}`),
  updateOrderStatusByOrderId: (orderId, statusData) =>
    api.put(`/admin/orders/order-status/${orderId}`, statusData),

  // Assign / re-assign / unassign order to a delivery boy (Admin only)
  assignDeliveryBoy: (orderId, deliveryBoyId) =>
    api.post('/admin/orders/assign', { orderId, deliveryBoyId }),

  // ✅ Edit order address / ward / city / typedArea (Admin only)
  editOrderAddress: (id, data) =>
    api.put(`/admin/orders/${id}/address`, data),

  // ========== REFUND ==========
  processRefund: (id, refundData = {}) => api.post(`/admin/orders/${id}/refund`, refundData),
// ✅ Today's Orders PDF (admin)
downloadTodayOrdersPDF: () =>
  api.get('/admin/orders/today/pdf', { responseType: 'blob' }),
  // ========== PAYMENT WEBHOOKS ==========
  updatePaymentSuccess: (data) => api.put('/orders/payment-success', data),
  updatePaymentFailed: (data) => api.put('/orders/payment-failed', data),
};