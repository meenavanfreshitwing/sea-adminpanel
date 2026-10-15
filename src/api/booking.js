import api from './axiosConfig';

export const bookingAPI = {
  // Store-wide rules: cutoff time, booking window, time slots
  getConfig: () => api.get('/admin/booking/config'),
  updateConfig: (data) => api.put('/admin/booking/config', data),

  // Calendar with status + order counts for a date range (YYYY-MM-DD)
  getCalendar: (from, to) => api.get('/admin/booking/calendar', { params: { from, to } }),

  // Block / unblock / notice / cutoff override for one date
  updateDate: (date, data) => api.put(`/admin/booking/dates/${date}`, data),
  clearDate: (date) => api.delete(`/admin/booking/dates/${date}`),

  // Orders already booked for a date, and paid orders needing review
  getOrdersForDate: (date) => api.get(`/admin/booking/dates/${date}/orders`),
  getReviewQueue: () => api.get('/admin/booking/review'),

  // Product-wise kg and order counts per delivery date
  getDeliverySummary: (from, to, pending) =>
    api.get('/admin/reports/delivery-summary', { params: { from, to, pending: pending ? 'true' : undefined } }),

  rescheduleOrder: (orderId, deliveryDate, deliverySlotId) =>
    api.patch(`/admin/orders/${orderId}/delivery-date`, { deliveryDate, deliverySlotId }),
};
