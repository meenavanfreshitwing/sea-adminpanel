// api/products.js
import api from './axiosConfig';

export const productsAPI = {
  // Public routes
  getAllProducts: (params = {}) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  getProductBySlug: (slug) => api.get(`/products/slug/${slug}`),
  
  // Featured Products with Price Filtering
  getFeaturedProducts: (params = {}) => api.get('/products/featured', { params }),
  getFeaturedPriceRanges: () => api.get('/products/featured/price-ranges'),
  getFilteredFeaturedProducts: (params = {}) => api.get('/products/featured/filter', { params }),
  
  // Offer Products
  getOfferProducts: (params = {}) => api.get('/products/offers', { params }),
  
  // Search Products
  searchProducts: (params = {}) => api.get('/products/search', { params }),
  quickSearchProducts: (query, limit = 5) => api.get('/products/quick-search', { 
    params: { q: query, limit } 
  }),
  
  // Admin routes (require authentication)
  createProduct: (formData) => {
    const token = localStorage.getItem('token');
    return api.post('/products', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
  },
  
  updateProduct: (id, formData) => {
    const token = localStorage.getItem('token');
    return api.put(`/products/${id}`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
  },
  
  deleteProduct: (id) => {
    const token = localStorage.getItem('token');
    return api.delete(`/products/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }
};