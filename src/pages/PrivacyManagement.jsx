// src/pages/PrivacyManagement.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import AddPrivacyModal from '../components/AddPrivacyModal';
import EditPrivacyModal from '../components/EditPrivacyModal';
import { privacyAPI } from '../api/privacy';
import { FaEdit, FaTrash, FaPlus, FaSignOutAlt, FaSyncAlt, FaSearch, FaFileAlt, FaHistory, FaEye, FaShieldAlt } from 'react-icons/fa';

const PrivacyManagement = () => {
  const { logout, isAdmin } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingPrivacy, setEditingPrivacy] = useState(null);
  const [viewingPrivacy, setViewingPrivacy] = useState(null);
  const [privacyList, setPrivacyList] = useState([]);
  const [filteredPrivacy, setFilteredPrivacy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch privacy policy from API
  const fetchPrivacy = async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) setRefreshing(true);
      else setLoading(true);

      const allVersionsResponse = await privacyAPI.getAllVersions();
      setPrivacyList(allVersionsResponse.data.data);
      setFilteredPrivacy(allVersionsResponse.data.data);

      setError('');
    } catch (error) {
      console.error('Error fetching privacy policy:', error);
      setError(error.response?.data?.message || 'Failed to load privacy policy');
      setPrivacyList([]);
      setFilteredPrivacy([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrivacy();
  }, []);

  // Search logic
  useEffect(() => {
    let results = [...privacyList];
    if (searchTerm) {
      results = results.filter(
        (privacy) =>
          privacy.privacyPolicyTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `Version ${privacy.version}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredPrivacy(results);
  }, [searchTerm, privacyList]);

  const handleRefresh = () => {
    fetchPrivacy(true);
  };

  const handleAddPrivacy = async (privacyData) => {
    try {
      const response = await privacyAPI.createOrUpdatePrivacy(privacyData);
      const newPrivacy = response.data.data;
      const newPrivacyList = [newPrivacy, ...privacyList];
      setPrivacyList(newPrivacyList);
      setFilteredPrivacy(newPrivacyList);
      setIsAddModalOpen(false);
      setError('✅ Privacy Policy added successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error adding privacy policy:', error);
      setError(error.response?.data?.message || 'Failed to add privacy policy');
    }
  };

  const handleEditPrivacy = async (privacyData) => {
    try {
      const response = await privacyAPI.createOrUpdatePrivacy(privacyData);
      const updatedPrivacy = response.data.data;
      const updatedPrivacyList = [updatedPrivacy, ...privacyList];
      setPrivacyList(updatedPrivacyList);
      setFilteredPrivacy(updatedPrivacyList);
      setIsEditModalOpen(false);
      setEditingPrivacy(null);
      setError('✅ Privacy Policy updated successfully! New version created.');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error updating privacy policy:', error);
      setError(error.response?.data?.message || 'Failed to update privacy policy');
    }
  };

  const handleDeletePrivacy = async (id, version) => {
    if (
      !window.confirm(
        `Are you sure you want to delete Version ${version}? This action cannot be undone.`
      )
    )
      return;

    try {
      await privacyAPI.deletePrivacy(id);
      const remainingPrivacy = privacyList.filter((privacy) => privacy._id !== id);
      setPrivacyList(remainingPrivacy);
      setFilteredPrivacy(remainingPrivacy);

      setError('✅ Privacy policy version deleted successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error deleting privacy policy:', error);
      setError(error.response?.data?.message || 'Failed to delete privacy policy version');
    }
  };

  const openEditModal = (privacy) => {
    setEditingPrivacy(privacy);
    setIsEditModalOpen(true);
  };

  const openViewModal = (privacy) => {
    setViewingPrivacy(privacy);
    setIsViewModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingPrivacy(null);
    setIsEditModalOpen(false);
  };

  const closeViewModal = () => {
    setViewingPrivacy(null);
    setIsViewModalOpen(false);
  };

  const privacyToRender = Array.isArray(filteredPrivacy) ? filteredPrivacy : [];
  const latestVersion = privacyList[0]?.version || 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 w-full">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Privacy Management</h1>
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
              <FaShieldAlt className="mr-2 text-[#ff0000]" />
              Privacy Versions ({privacyToRender.length})
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

          {/* Search Section */}
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

          {/* Privacy Policy Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff0000] mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading privacy policy...</p>
              </div>
            ) : privacyToRender.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <FaShieldAlt className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No privacy policy found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search' : 'No privacy policy available'}
                </p>
                {isAdmin && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-[#ff0000] text-white rounded-lg hover:bg-[#cc0000]"
                  >
                    <FaPlus className="mr-2" /> Create Privacy Policy
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Desktop View */}
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
                    {privacyToRender.map((privacy, index) => (
                      <tr key={privacy._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 text-center">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                privacy.version === latestVersion
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              v{privacy.version}
                            </span>
                            {privacy.version === latestVersion && (
                              <span className="text-[10px] font-medium text-green-700">
                                LATEST
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {privacy.privacyPolicyTitle}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {privacy.privacyPolicyLastUpdated}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {privacy.privacySections?.length || 0} sections
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openViewModal(privacy)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center"
                                title="View Details"
                              >
                                <FaEye className="mr-1" /> View
                              </button>
                              <button
                                onClick={() => openEditModal(privacy)}
                                className="bg-gradient-to-r from-[#ff0000] to-[#cc0000] hover:from-[#cc0000] hover:to-[#aa0000] text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center"
                                title="Edit (Creates New Version)"
                              >
                                <FaEdit className="mr-1" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeletePrivacy(privacy._id, privacy.version)}
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
                    {privacyToRender.map((privacy, index) => (
                      <div key={privacy._id} className="p-4 hover:bg-gray-50">
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-500">
                              #{index + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  privacy.version === latestVersion
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                v{privacy.version}
                              </span>
                              {privacy.version === latestVersion && (
                                <span className="text-[10px] font-medium text-green-700">
                                  LATEST
                                </span>
                              )}
                            </div>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {privacy.privacyPolicyTitle}
                          </h3>
                          <div className="text-xs text-gray-500 mt-1">
                            Updated: {privacy.privacyPolicyLastUpdated}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {privacy.privacySections?.length || 0} sections
                            </span>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                              {privacy.privacyDataCollection?.length || 0} collection items
                            </span>
                          </div>

                          {isAdmin && (
                            <div className="flex space-x-2 mt-3">
                              <button
                                onClick={() => openViewModal(privacy)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center justify-center flex-1"
                              >
                                <FaEye className="mr-1" /> View
                              </button>
                              <button
                                onClick={() => openEditModal(privacy)}
                                className="bg-gradient-to-r from-[#ff0000] to-[#cc0000] hover:from-[#cc0000] hover:to-[#aa0000] text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center justify-center flex-1"
                              >
                                <FaEdit className="mr-1" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeletePrivacy(privacy._id, privacy.version)}
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
          {isAdmin && privacyToRender.length > 1 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <FaHistory className="text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800">
                    <strong>Version History:</strong> Each time you edit the privacy policy, a
                    new version is created. The latest version is shown to users. Previous
                    versions are kept for legal records and compliance.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* GDPR/CCPA Compliance Note */}
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-start gap-3">
              <FaShieldAlt className="text-purple-500 mt-0.5" />
              <div>
                <p className="text-sm text-purple-800">
                  <strong>Compliance Note:</strong> This privacy policy helps with GDPR and
                  CCPA compliance requirements. Ensure you regularly update the policy to
                  reflect any changes in data collection or processing practices.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Modals */}
        <AddPrivacyModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddPrivacy={handleAddPrivacy}
        />

        <EditPrivacyModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          onEditPrivacy={handleEditPrivacy}
          privacy={editingPrivacy}
        />

        {isViewModalOpen && viewingPrivacy && (
          <ViewPrivacyModal
            isOpen={isViewModalOpen}
            onClose={closeViewModal}
            privacy={viewingPrivacy}
          />
        )}
      </div>
    </div>
  );
};

// View Privacy Modal Component
const ViewPrivacyModal = ({ isOpen, onClose, privacy }) => {
  const [activeTab, setActiveTab] = useState('overview');

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
              {privacy.privacyPolicyTitle}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Version {privacy.version} • Last updated: {privacy.privacyPolicyLastUpdated}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#ff0000] transition-colors"
          >
            <FaFileAlt size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b px-6 overflow-x-auto">
          <div className="flex gap-4 whitespace-nowrap">
            <button onClick={() => setActiveTab('overview')} className={`py-2 px-4 font-medium transition-colors ${activeTab === 'overview' ? 'text-[#ff0000] border-b-2 border-[#ff0000]' : 'text-gray-500 hover:text-gray-700'}`}>Overview</button>
            <button onClick={() => setActiveTab('collection')} className={`py-2 px-4 font-medium transition-colors ${activeTab === 'collection' ? 'text-[#ff0000] border-b-2 border-[#ff0000]' : 'text-gray-500 hover:text-gray-700'}`}>Data Collection</button>
            <button onClick={() => setActiveTab('usage')} className={`py-2 px-4 font-medium transition-colors ${activeTab === 'usage' ? 'text-[#ff0000] border-b-2 border-[#ff0000]' : 'text-gray-500 hover:text-gray-700'}`}>Data Usage</button>
            <button onClick={() => setActiveTab('sharing')} className={`py-2 px-4 font-medium transition-colors ${activeTab === 'sharing' ? 'text-[#ff0000] border-b-2 border-[#ff0000]' : 'text-gray-500 hover:text-gray-700'}`}>Data Sharing</button>
            <button onClick={() => setActiveTab('rights')} className={`py-2 px-4 font-medium transition-colors ${activeTab === 'rights' ? 'text-[#ff0000] border-b-2 border-[#ff0000]' : 'text-gray-500 hover:text-gray-700'}`}>Your Rights</button>
            <button onClick={() => setActiveTab('sections')} className={`py-2 px-4 font-medium transition-colors ${activeTab === 'sections' ? 'text-[#ff0000] border-b-2 border-[#ff0000]' : 'text-gray-500 hover:text-gray-700'}`}>Sections</button>
            <button onClick={() => setActiveTab('legal')} className={`py-2 px-4 font-medium transition-colors ${activeTab === 'legal' ? 'text-[#ff0000] border-b-2 border-[#ff0000]' : 'text-gray-500 hover:text-gray-700'}`}>Legal Info</button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Introduction</h3>
                <p className="text-blue-700 text-sm">{privacy.privacyIntroduction}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600"><strong className="text-gray-800">Data Collection:</strong> {privacy.privacyDataCollection?.length || 0} items</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600"><strong className="text-gray-800">Data Usage:</strong> {privacy.privacyDataUsage?.length || 0} purposes</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600"><strong className="text-gray-800">Data Sharing:</strong> {privacy.privacyDataSharing?.length || 0} recipients</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600"><strong className="text-gray-800">User Rights:</strong> {privacy.privacyUserRights?.length || 0} rights</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'collection' && privacy.privacyDataCollection && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Information We Collect</h3>
              <div className="space-y-2">
                {privacy.privacyDataCollection.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 px-4 py-2 rounded text-sm text-gray-700">• {item}</div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'usage' && privacy.privacyDataUsage && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">How We Use Your Information</h3>
              <div className="space-y-2">
                {privacy.privacyDataUsage.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 px-4 py-2 rounded text-sm text-gray-700">• {item}</div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sharing' && privacy.privacyDataSharing && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Information Sharing</h3>
              <div className="space-y-2">
                {privacy.privacyDataSharing.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 px-4 py-2 rounded text-sm text-gray-700">• {item}</div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rights' && privacy.privacyUserRights && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Privacy Rights</h3>
              <div className="space-y-2">
                {privacy.privacyUserRights.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 px-4 py-2 rounded text-sm text-gray-700">• {item}</div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sections' && privacy.privacySections && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Policy Sections</h3>
              {privacy.privacySections.map((section) => (
                <div key={section.number} className="border-l-4 border-[#ff0000] pl-4">
                  <h4 className="font-semibold text-gray-800 mb-2">{section.number}. {section.title}</h4>
                  <p className="text-gray-600 text-sm">{section.content}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'legal' && (
            <div className="grid grid-cols-1 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Data Security</h4>
                <p className="text-gray-600 text-sm">{privacy.privacyDataSecurity}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Cookies Policy</h4>
                <p className="text-gray-600 text-sm">{privacy.privacyCookies}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Third-Party Links</h4>
                <p className="text-gray-600 text-sm">{privacy.privacyThirdPartyLinks}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Policy Changes</h4>
                <p className="text-gray-600 text-sm">{privacy.privacyPolicyChanges}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Contact Information</h4>
                <p className="text-gray-600 text-sm">{privacy.privacyContactInfo}</p>
              </div>
            </div>
          )}
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

export default PrivacyManagement;