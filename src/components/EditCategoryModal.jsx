// src/components/EditCategoryModal.jsx
import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, X, Trash2 } from 'lucide-react';

const EditCategoryModal = ({ isOpen, onClose, onEditCategory, category }) => {
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [deleteImage, setDeleteImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const R2_BASE = import.meta.env.VITE_R2_PUBLIC_URL;

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      
      // 🎯 Build full URL from R2 key (or use directly if it's already a full URL)
      if (category.image) {
        const img = category.image;
        setExistingImage(img.startsWith('http') ? img : `${R2_BASE}/${img}`);
      } else {
        setExistingImage(null);
      }
      
      setImageFile(null);
      setImagePreview(null);
      setDeleteImage(false);
    }
  }, [category, R2_BASE]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      setImageFile(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
      setDeleteImage(false);
      setError('');
    }
  };

  const handleDeleteImage = () => {
    setDeleteImage(true);
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    setExistingImage(null);
  };

  const removeNewImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!name.trim()) {
      setError('Category name is required');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      if (deleteImage) {
        formData.append('deleteImage', 'true');
      }
      
      await onEditCategory(category._id, formData);
      onClose();
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Edit Category</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-[#ff0000] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0000] focus:border-transparent text-sm"
              placeholder="Enter category name"
              autoFocus
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Image
            </label>
            
            {/* Existing Image */}
            {existingImage && !deleteImage && !imagePreview && (
              <div className="mb-3">
                <div className="relative inline-block">
                  <img
                    src={existingImage}
                    alt={category?.name}
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={handleDeleteImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Current image</p>
              </div>
            )}
            
            {/* New Image Preview */}
            {imagePreview && (
              <div className="mb-3">
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="New preview"
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeNewImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="text-xs text-green-600 mt-1">New image (will replace current)</p>
              </div>
            )}
            
            {/* Upload Button */}
            {!imagePreview && (deleteImage || !existingImage) && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#ff0000] transition-colors text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="category-image-edit"
                />
                <label
                  htmlFor="category-image-edit"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <ImageIcon size={32} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">
                    {deleteImage ? 'Upload new image' : 'Click to upload image'}
                  </span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG up to 5MB</span>
                </label>
              </div>
            )}
            
            {/* Change Image Button */}
            {existingImage && !deleteImage && !imagePreview && (
              <button
                type="button"
                onClick={() => {
                  setDeleteImage(true);
                  setExistingImage(null);
                }}
                className="mt-2 text-xs text-[#ff0000] hover:text-[#cc0000]"
              >
                Change image
              </button>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#ff0000] rounded-lg hover:bg-[#cc0000] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Updating...' : 'Update Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCategoryModal;