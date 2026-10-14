// src/pages/Returns.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import AddReturnModal from '../components/AddReturnModal';
import EditReturnModal from '../components/EditReturnModal';
import { returnsAPI } from '../api/returns';
import { FaEdit, FaTrash, FaPlus, FaSignOutAlt, FaSyncAlt, FaUndo } from 'react-icons/fa';

const Returns = () => {
  const { user, logout, isAdmin } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState(null);

  const [returnList, setReturnList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchReturns = async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) setRefreshing(true);
      else setLoading(true);

      const response = await returnsAPI.getReturnPolicy();
      const data = response.data;

      let items = [];
      if (data?.success && data?.data) {
        items = Array.isArray(data.data) ? data.data : [data.data];
      } else if (Array.isArray(data)) {
        items = data;
      }

      setReturnList(items);
      setError('');
    } catch (error) {
      console.error('Error fetching return policy:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load return policy');
      setReturnList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleRefresh = () => {
    fetchReturns(true);
  };

  const handleDeleteReturn = async (id) => {
    if (!window.confirm('Are you sure you want to delete this return policy?')) return;
    try {
      await returnsAPI.deleteReturnPolicy(id);
      setReturnList(returnList.filter((r) => r._id !== id));
      setError('✅ Return policy deleted successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error deleting return policy:', error);
      setError(error.response?.data?.message || 'Failed to delete return policy');
    }
  };

  const openEditModal = (item) => {
    setEditingReturn(item);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingReturn(null);
    setIsEditModalOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 w-full">
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Returns Management</h1>
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

        <main className="p-4 sm:p-6">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 flex items-center">
              <FaUndo className="mr-2 text-[#ff0000]" />
              Return Policies ({returnList.length})
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
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-[#ff0000] to-[#cc0000] hover:from-[#cc0000] hover:to-[#aa0000] text-white px-4 py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px]"
                >
                  <FaPlus className="sm:mr-2" />
                  <span className="hidden sm:inline">Add Return Policy</span>
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

          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff0000] mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading return policy...</p>
              </div>
            ) : returnList.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <FaUndo className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No return policy found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Click "Add Return Policy" to create one.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Desktop Table */}
                <table className="hidden md:table min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Badge</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Steps</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
                      {isAdmin && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {returnList.map((item, index) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 text-center">{index + 1}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{item.title}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{item.headerBadge || '—'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {item.returnSteps?.length || 0} steps
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {item.updatedAt
                              ? new Date(item.updatedAt).toLocaleDateString()
                              : '—'}
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openEditModal(item)}
                                className="bg-gradient-to-r from-[#ff0000] to-[#cc0000] hover:from-[#cc0000] hover:to-[#aa0000] text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center"
                              >
                                <FaEdit className="mr-1" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteReturn(item._id)}
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center"
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
                    {returnList.map((item, index) => (
                      <div key={item._id} className="p-4 hover:bg-gray-50">
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {item.returnSteps?.length || 0} steps
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-600">{item.headerBadge || '—'}</p>
                          <div className="text-xs text-gray-500 mt-1">
                            Updated: {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—'}
                          </div>

                          {isAdmin && (
                            <div className="flex space-x-2 mt-3">
                              <button
                                onClick={() => openEditModal(item)}
                                className="bg-gradient-to-r from-[#ff0000] to-[#cc0000] hover:from-[#cc0000] hover:to-[#aa0000] text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center justify-center flex-1"
                              >
                                <FaEdit className="mr-1" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteReturn(item._id)}
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
        </main>

        <AddReturnModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={(data) => {
            setReturnList([data]);
            setIsModalOpen(false);
            setError('✅ Return policy added successfully!');
            setTimeout(() => setError(''), 3000);
          }}
        />

        <EditReturnModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          onSuccess={(data) => {
            setReturnList([data]);
            closeEditModal();
            setError('✅ Return policy updated successfully!');
            setTimeout(() => setError(''), 3000);
          }}
          returnId={editingReturn?._id}
        />
      </div>
    </div>
  );
};

export default Returns;