// src/pages/Categories.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import AddCategoryModal from '../components/AddCategoryModal';
import EditCategoryModal from '../components/EditCategoryModal';
import { categoriesAPI } from '../api/categories';
import { FaEdit, FaTrash, FaPlus, FaSignOutAlt, FaSyncAlt, FaSearch } from 'react-icons/fa';

const Categories = () => {
  const { user, logout, isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const R2_BASE = import.meta.env.VITE_R2_PUBLIC_URL;

  // 🎯 Build full URL from key (or use as-is if already a full URL)
  const getCategoryImage = (category) => {
    if (!category.image) return null;
    const img = category.image;
    return img.startsWith('http') ? img : `${R2_BASE}/${img}`;
  };

  const fetchCategories = async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await categoriesAPI.getAllCategories();
      
      let categoriesArray = [];
      const data = response.data;
      
      if (data.categories && Array.isArray(data.categories)) {
        categoriesArray = data.categories;
      } else if (Array.isArray(data)) {
        categoriesArray = data;
      } else {
        throw new Error('Unexpected response format');
      }

      setCategories(categoriesArray);
      setFilteredCategories(categoriesArray);
      setError('');
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(error.message || 'Failed to load categories');
      setCategories([]);
      setFilteredCategories([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    let results = [...categories];
    if (searchTerm) {
      results = results.filter(category =>
        category.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredCategories(results);
  }, [searchTerm, categories]);

  const handleRefresh = () => {
    fetchCategories(true);
  };

  const handleAddCategory = async (categoryData) => {
    try {
      const response = await categoriesAPI.createCategory(categoryData);
      const newCategory = response.data.category;
      const newCategories = [...categories, newCategory];
      setCategories(newCategories);
      setFilteredCategories(newCategories);
      setIsModalOpen(false);
      setError('✅ Category added successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error adding category:', error);
      setError(error.response?.data?.message || 'Failed to add category');
    }
  };

  const handleEditCategory = async (categoryId, categoryData) => {
    try {
      const response = await categoriesAPI.updateCategory(categoryId, categoryData);
      const updatedCategory = response.data.category;
      const updatedCategories = categories.map(cat => 
        cat._id === categoryId ? updatedCategory : cat
      );
      setCategories(updatedCategories);
      setFilteredCategories(updatedCategories);
      setIsEditModalOpen(false);
      setEditingCategory(null);
      setError('✅ Category updated successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error updating category:', error);
      setError(error.response?.data?.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await categoriesAPI.deleteCategory(id);
      const remainingCategories = categories.filter(cat => cat._id !== id);
      setCategories(remainingCategories);
      setFilteredCategories(remainingCategories);
      setError('✅ Category deleted successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error deleting category:', error);
      const errorMsg = error.response?.data?.message || 'Failed to delete category';
      setError(errorMsg);
    }
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingCategory(null);
    setIsEditModalOpen(false);
  };

  const categoriesToRender = Array.isArray(filteredCategories) ? filteredCategories : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 w-full">
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Categories Management</h1>
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
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
              All Categories ({categoriesToRender.length})
            </h2>
            <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
              <button
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh categories"
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
                  <span className="hidden sm:inline">Add Category</span>
                  <span className="sm:hidden">Add</span>
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className={`px-4 py-3 rounded mb-4 text-sm ${
              error.includes('✅') 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {error}
            </div>
          )}

          <div className="mb-6 bg-white rounded-xl p-3 md:p-4 border border-slate-200 shadow-sm">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search categories by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 md:py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0000] focus:border-transparent text-sm md:text-base"
              />
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff0000] mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading categories...</p>
              </div>
            ) : categoriesToRender.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <FaSearch className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No categories found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search' : 'No categories available'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Desktop Table */}
                <table className="hidden md:table min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                      {isAdmin && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categoriesToRender.map((category, index) => {
                      const imageUrl = getCategoryImage(category);
                      return (
                        <tr key={category._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 text-center">{index + 1}</div>
                          </td>
                          <td className="px-6 py-4">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={category.name}
                                className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                  e.target.parentNode.innerHTML = '<div class="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200"><span class="text-[10px] text-gray-400">No Image</span></div>';
                                }}
                              />
                            ) : (
                              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                <span className="text-[10px] text-gray-400">No Image</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{category.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500">{new Date(category.createdAt).toLocaleDateString()}</div>
                          </td>
                          {isAdmin && (
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openEditModal(category)}
                                  className="bg-gradient-to-r from-[#ff0000] to-[#cc0000] hover:from-[#cc0000] hover:to-[#aa0000] text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center"
                                >
                                  <FaEdit className="mr-1" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category._id)}
                                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center"
                                >
                                  <FaTrash className="mr-1" /> Delete
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Mobile View */}
                <div className="md:hidden">
                  <div className="divide-y divide-gray-200">
                    {categoriesToRender.map((category, index) => {
                      const imageUrl = getCategoryImage(category);
                      return (
                        <div key={category._id} className="p-4 hover:bg-gray-50">
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                              <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                            </div>
                            
                            {/* Image in mobile view */}
                            <div className="mb-3">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={category.name}
                                  className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.parentNode.innerHTML = '<div class="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200"><span class="text-xs text-gray-400">No Image</span></div>';
                                  }}
                                />
                              ) : (
                                <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                  <span className="text-xs text-gray-400">No Image</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-3">
                              <span className="font-medium">Created:</span> {new Date(category.createdAt).toLocaleDateString()}
                            </div>
                            
                            {isAdmin && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openEditModal(category)}
                                  className="bg-gradient-to-r from-[#ff0000] to-[#cc0000] hover:from-[#cc0000] hover:to-[#aa0000] text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center justify-center flex-1"
                                >
                                  <FaEdit className="mr-1" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category._id)}
                                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center justify-center flex-1"
                                >
                                  <FaTrash className="mr-1" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        <AddCategoryModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddCategory={handleAddCategory}
        />

        <EditCategoryModal 
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          onEditCategory={handleEditCategory}
          category={editingCategory}
        />
      </div>
    </div>
  );
};

export default Categories;