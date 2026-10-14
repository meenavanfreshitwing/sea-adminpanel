import api from './axiosConfig';

export const termsAPI = {
  // Get active terms of service (public)
  getTerms: () => api.get('/terms'),
  
  // Get specific version of terms (public)
  getTermsByVersion: (version) => api.get(`/terms/version/${version}`),
  
  // Get all versions of terms (admin only)
  getAllVersions: () => api.get('/terms/admin/versions'),
  
  // Create or update terms (creates new version) (admin only)
  createOrUpdateTerms: (termsData) => api.post('/terms', termsData),
  
  // Update specific section (admin only)
  updateSection: (sectionNumber, sectionData) => 
    api.put(`/terms/section/${sectionNumber}`, sectionData),
  
  // Update user requirements (admin only)
  updateRequirements: (requirementsData) => 
    api.put('/terms/requirements', requirementsData),
  
  // Soft delete terms (deactivate) (admin only)
  deleteTerms: (termsId) => api.delete(`/terms/${termsId}`),
  
  // Hard delete terms (permanent) (admin only)
  hardDeleteTerms: (termsId) => api.delete(`/terms/hard/${termsId}`),
};