// src/pages/TermsManagement.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import AddTermsModal from '../components/AddTermsModal';
import EditTermsModal from '../components/EditTermsModal';
import { termsAPI } from '../api/terms';
import { 
  FaEdit, FaTrash, FaPlus, FaSignOutAlt, FaSyncAlt, FaSearch, 
  FaFileAlt, FaHistory, FaEye 
} from 'react-icons/fa';

const TermsManagement = () => {
  const { logout, isAdmin } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingTerms, setEditingTerms] = useState(null);
  const [viewingTerms, setViewingTerms] = useState(null);
  const [termsList, setTermsList] = useState([]);
  const [filteredTerms, setFilteredTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch terms from API
  const fetchTerms = async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) setRefreshing(true);
      else setLoading(true);

      const allVersionsResponse = await termsAPI.getAllVersions();
      setTermsList(allVersionsResponse.data.data);
      setFilteredTerms(allVersionsResponse.data.data);

      setError('');
    } catch (error) {
      console.error('Error fetching terms:', error);
      setError(error.response?.data?.message || 'Failed to load terms of service');
      setTermsList([]);
      setFilteredTerms([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  // Search logic
  useEffect(() => {
    let results = [...termsList];
    if (searchTerm) {
      results = results.filter(
        (terms) =>
          terms.termsOfServiceTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `Version ${terms.version}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredTerms(results);
  }, [searchTerm, termsList]);

  const handleRefresh = () => {
    fetchTerms(true);
  };

  const handleAddTerms = async (termsData) => {
    try {
      const response = await termsAPI.createOrUpdateTerms(termsData);
      const newTerms = response.data.data;
      const newTermsList = [newTerms, ...termsList];
      setTermsList(newTermsList);
      setFilteredTerms(newTermsList);
      setIsAddModalOpen(false);
      setError('✅ Terms of Service added successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error adding terms:', error);
      setError(error.response?.data?.message || 'Failed to add terms of service');
    }
  };

  const handleEditTerms = async (termsData) => {
    try {
      const response = await termsAPI.createOrUpdateTerms(termsData);
      const updatedTerms = response.data.data;
      const updatedTermsList = [updatedTerms, ...termsList];
      setTermsList(updatedTermsList);
      setFilteredTerms(updatedTermsList);
      setIsEditModalOpen(false);
      setEditingTerms(null);
      setError('✅ Terms of Service updated successfully! New version created.');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error updating terms:', error);
      setError(error.response?.data?.message || 'Failed to update terms of service');
    }
  };

  const handleDeleteTerms = async (id, version) => {
    if (
      !window.confirm(
        `Are you sure you want to delete Version ${version}? This action cannot be undone.`
      )
    )
      return;

    try {
      await termsAPI.deleteTerms(id);
      const remainingTerms = termsList.filter((terms) => terms._id !== id);
      setTermsList(remainingTerms);
      setFilteredTerms(remainingTerms);

      setError('✅ Terms version deleted successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error deleting terms:', error);
      setError(error.response?.data?.message || 'Failed to delete terms version');
    }
  };

  const openEditModal = (terms) => {
    setEditingTerms(terms);
    setIsEditModalOpen(true);
  };

  const openViewModal = (terms) => {
    setViewingTerms(terms);
    setIsViewModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingTerms(null);
    setIsEditModalOpen(false);
  };

  const closeViewModal = () => {
    setViewingTerms(null);
    setIsViewModalOpen(false);
  };

  const termsToRender = Array.isArray(filteredTerms) ? filteredTerms : [];
  const latestVersion = termsList[0]?.version || 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 w-full">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Terms Management</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={logout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center"
                title="Logout"
              >
                <span className="hidden sm:inline mr-2">Logout</span>
                <FaSignOutAlt />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-6">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 flex items-center">
              <FaFileAlt className="mr-2 text-[#ff0000]" />
              Terms Versions ({termsToRender.length})
            </h2>
            <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
              <button
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh"
              >
                <FaSyncAlt className={`sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-[#ff0000] to-[#cc0000] hover:from-[#cc0000] hover:to-[#aa0000] text-white px-4 py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px]"
                >
                  <FaPlus className="sm:mr-2" />
                  <span className="hidden sm:inline">Add New Version</span>
                  <span className="sm:hidden">Add</span>
                </button>
              )}
            </div>
          </div>

          {error && (
            <div
              className={`px-4 py-3 rounded mb-4 text-sm ${
                error.includes('✅')
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {error}
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-6 bg-white rounded-xl p-3 md:p-4 border border-slate-200 shadow-sm">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by title or version..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 md:py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0000] focus:border-transparent text-sm md:text-base"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff0000] mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading terms of service...</p>
              </div>
            ) : termsToRender.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <FaFileAlt className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No terms found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search' : 'No terms of service available'}
                </p>
                {isAdmin && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-[#ff0000] text-white rounded-lg hover:bg-[#cc0000]"
                  >
                    <FaPlus className="mr-2" /> Create Terms of Service
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Desktop Table */}
                <table className="hidden md:table min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Version
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sections
                      </th>
                      {isAdmin && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {termsToRender.map((terms, index) => (
                      <tr key={terms._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 text-center">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                terms.version === latestVersion
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              v{terms.version}
                            </span>
                            {terms.version === latestVersion && (
                              <span className="text-[10px] font-medium text-green-700">
                                LATEST
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {terms.termsOfServiceTitle}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {terms.termsOfServiceLastUpdated}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {terms.termsSections?.length || 0} sections
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openViewModal(terms)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center"
                                title="View Details"
                              >
                                <FaEye className="mr-1" /> View
                              </button>
                              <button
                                onClick={() => openEditModal(terms)}
                                className="bg-gradient-to-r from-[#ff0000] to-[#cc0000] hover:from-[#cc0000] hover:to-[#aa0000] text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center"
                                title="Edit (Creates New Version)"
                              >
                                <FaEdit className="mr-1" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTerms(terms._id, terms.version)}
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center"
                                title="Delete Version"
                              >
                                <FaTrash className="mr-1" /> Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile View */}
                <div className="md:hidden">
                  <div className="divide-y divide-gray-200">
                    {termsToRender.map((terms, index) => (
                      <div key={terms._id} className="p-4 hover:bg-gray-50">
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-500">
                              #{index + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  terms.version === latestVersion
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                v{terms.version}
                              </span>
                              {terms.version === latestVersion && (
                                <span className="text-[10px] font-medium text-green-700">
                                  LATEST
                                </span>
                              )}
                            </div>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {terms.termsOfServiceTitle}
                          </h3>
                          <div className="text-xs text-gray-500 mt-1">
                            Updated: {terms.termsOfServiceLastUpdated}
                          </div>
                          <div className="mt-2">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {terms.termsSections?.length || 0} sections
                            </span>
                          </div>

                          {isAdmin && (
                            <div className="flex space-x-2 mt-3">
                              <button
                                onClick={() => openViewModal(terms)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center justify-center flex-1"
                              >
                                <FaEye className="mr-1" /> View
                              </button>
                              <button
                                onClick={() => openEditModal(terms)}
                                className="bg-gradient-to-r from-[#ff0000] to-[#cc0000] hover:from-[#cc0000] hover:to-[#aa0000] text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center justify-center flex-1"
                              >
                                <FaEdit className="mr-1" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTerms(terms._id, terms.version)}
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center justify-center flex-1"
                              >
                                <FaTrash className="mr-1" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Version History Note */}
          {isAdmin && termsToRender.length > 1 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <FaHistory className="text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800">
                    <strong>Version History:</strong> Each time you edit the terms of service,
                    a new version is created. The latest version is shown to users. Previous
                    versions are kept for legal records.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Modals */}
        <AddTermsModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddTerms={handleAddTerms}
        />

        <EditTermsModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          onEditTerms={handleEditTerms}
          terms={editingTerms}
        />

        {isViewModalOpen && viewingTerms && (
          <ViewTermsModal
            isOpen={isViewModalOpen}
            onClose={closeViewModal}
            terms={viewingTerms}
          />
        )}
      </div>
    </div>
  );
};

// View Terms Modal Component
const ViewTermsModal = ({ isOpen, onClose, terms }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-xl my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {terms.termsOfServiceTitle}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Version {terms.version} • Last updated: {terms.termsOfServiceLastUpdated}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#ff0000] transition-colors"
          >
            <FaFileAlt size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Important Notice */}
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Important Notice</h3>
            <p className="text-yellow-700 text-sm">{terms.termsImportantNotice}</p>
          </div>

          {/* User Requirements */}
          {terms.termsUserRequirements && terms.termsUserRequirements.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                User Requirements
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {terms.termsUserRequirements.map((req, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 px-3 py-2 rounded text-sm text-gray-700"
                  >
                    • {req}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Terms Sections */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Terms Sections
            </h3>
            <div className="space-y-6">
              {terms.termsSections.map((section) => (
                <div
                  key={section.number}
                  className="border-l-4 border-[#ff0000] pl-4"
                >
                  <h4 className="font-semibold text-gray-800 mb-2">
                    {section.number}. {section.title}
                  </h4>
                  <p className="text-gray-600 text-sm">{section.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">
                Intellectual Property
              </h4>
              <p className="text-gray-600 text-sm">
                {terms.termsIntellectualProperty}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">
                Limitation of Liability
              </h4>
              <p className="text-gray-600 text-sm">
                {terms.termsLimitationLiability}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">
                Changes to Terms
              </h4>
              <p className="text-gray-600 text-sm">{terms.termsChangesNotice}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">
                Contact Information
              </h4>
              <p className="text-gray-600 text-sm">{terms.termsContactInfo}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsManagement;