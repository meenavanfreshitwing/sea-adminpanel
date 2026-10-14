import api from './axiosConfig';

export const privacyAPI = {
  // Get active privacy policy (public)
  getPrivacy: () => api.get('/privacy'),
  
  // Get specific version of privacy policy (public)
  getPrivacyByVersion: (version) => api.get(`/privacy/version/${version}`),
  
  // Get all versions of privacy policy (admin only)
  getAllVersions: () => api.get('/privacy/admin/versions'),
  
  // Create or update privacy policy (creates new version) (admin only)
  createOrUpdatePrivacy: (privacyData) => api.post('/privacy', privacyData),
  
  // Update specific section (admin only)
  updateSection: (sectionNumber, sectionData) => 
    api.put(`/privacy/section/${sectionNumber}`, sectionData),
  
  // Update data collection practices (admin only)
  updateDataCollection: (dataCollectionData) => 
    api.put('/privacy/data-collection', dataCollectionData),
  
  // Soft delete privacy policy (deactivate) (admin only)
  deletePrivacy: (privacyId) => api.delete(`/privacy/${privacyId}`),
  
  // Hard delete privacy policy (permanent) (admin only)
  hardDeletePrivacy: (privacyId) => api.delete(`/privacy/hard/${privacyId}`),
};