// src/api/categories.js
import api from './axiosConfig';

export const categoriesAPI = {
  // Get all categories
  getAllCategories: () => api.get('/categories'),
  
  // Get single category
  getCategory: (id) => api.get(`/categories/${id}`),
  
  // Create category (with image)
  createCategory: (categoryData) => {
    // Check if FormData is being used (has image)
    if (categoryData instanceof FormData) {
      return api.post('/categories', categoryData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    // For regular JSON data (only name field)
    return api.post('/categories', categoryData);
  },
  
  // Update category (with image)
  updateCategory: (id, categoryData) => {
    // Check if FormData is being used (has image or deleteImage flag)
    if (categoryData instanceof FormData) {
      return api.put(`/categories/${id}`, categoryData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    // For regular JSON data (only name field or deleteImage boolean)
    return api.put(`/categories/${id}`, categoryData);
  },
  
  // Delete category
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};