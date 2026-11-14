// src/api/locations.js — delivery locations and location-wise prices
import api from './axiosConfig';

export const locationsAPI = {
  list: () => api.get('/admin/locations'),
  create: (data) => api.post('/admin/locations', data),
  update: (id, data) => api.put(`/admin/locations/${id}`, data),
  remove: (id) => api.delete(`/admin/locations/${id}`),

  // Quick price screen: every product & pack with its default and this location's price
  getPrices: (id) => api.get(`/admin/locations/${id}/prices`),
  // items: [{ productId, variantId?, price?, originalPrice?, isAvailable?, clear? }]
  savePrices: (id, items) => api.put(`/admin/locations/${id}/prices`, { items }),
};

// Shared, cached list for the product forms (one request per page load)
let cached = null;
export const loadLocationsOnce = () => {
  if (!cached) {
    cached = locationsAPI.list()
      .then(res => res.data?.data || [])
      .catch(err => { cached = null; throw err; });
  }
  return cached;
};
export const clearLocationsCache = () => { cached = null; };

// Product form rows ⇄ API shape
export const toFormLocationPrices = (list = []) =>
  (list || []).map(lp => ({
    location: String(lp.location?._id || lp.location),
    price: lp.price ?? '',
    originalPrice: lp.originalPrice ?? '',
    isAvailable: lp.isAvailable !== false,
  }));

export const toApiLocationPrices = (rows = []) =>
  (rows || [])
    .filter(r => r.price !== '' || r.isAvailable === false)
    .map(r => ({
      location: r.location,
      price: r.price === '' ? null : parseFloat(r.price),
      originalPrice: r.originalPrice === '' ? null : parseFloat(r.originalPrice),
      isAvailable: r.isAvailable !== false,
    }));
