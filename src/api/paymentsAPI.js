import api from './axiosConfig';

export const paymentsAPI = {
  // Create Razorpay order
  createRazorpayOrder: (orderData) => api.post('/payments/create-order', orderData),
  
  // Verify payment
  verifyPayment: (paymentData) => api.post('/payments/verify-payment', paymentData),
  
  // Payment failed
  paymentFailed: (paymentData) => api.post('/payments/payment-failed', paymentData),
  
  // Get payment status by order ID (authenticated)
  getPaymentStatus: (orderId) => api.get(`/payments/status/${orderId}`),
  
  // Refund payment (Admin only)
  refundPayment: (paymentId, refundData) => api.post(`/payments/refund/${paymentId}`, refundData),
};