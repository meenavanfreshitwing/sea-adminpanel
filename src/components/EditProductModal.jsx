// src/components/EditProductModal.jsx - VARIANT ONLY VERSION (No Simple Product, No SEO)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { categoriesAPI } from '../api/categories';
import { productsAPI } from '../api/products';
import { 
  X, Upload, Plus, Trash2, Tag, Package, DollarSign, 
  FileText, Settings, Image, ChevronDown, ChevronUp, 
  Save, AlertCircle, Layers, Info 
} from 'lucide-react';

// 🎯 Tamil-safe slug generator
const generateSlug = (text) => {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')                    // spaces → dashes
    .replace(/[^\p{L}\p{N}\p{M}\-]+/gu, '')  // keep letters + numbers + marks + dashes
    .replace(/-+/g, '-')                     // collapse multiple dashes
    .replace(/^-+/, '')                      // trim leading dash
    .replace(/-+$/, '');                     // trim trailing dash
};

const EditProductModal = ({ isOpen, onClose, onEditProduct, product }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    seller: '',
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);
  const [specifications, setSpecifications] = useState([]);
  const [keyFeatures, setKeyFeatures] = useState([]);
  const [newKeyFeature, setNewKeyFeature] = useState('');
  const [variants, setVariants] = useState([]);
  const [variantImageFiles, setVariantImageFiles] = useState({});
  const [variantImagePreviews, setVariantImagePreviews] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    category: true,
    variants: true,
    specifications: false,
    features: false,
  });

  // Track deleted images
  const [deletedVariantImages, setDeletedVariantImages] = useState({});

  const previewUrls = useRef(new Set());
  const modalContentRef = useRef(null);

  const addPreviewUrl = useCallback((url) => {
    if (url) previewUrls.current.add(url);
  }, []);

  const cleanupPreviews = useCallback(() => {
    previewUrls.current.forEach(url => URL.revokeObjectURL(url));
    previewUrls.current.clear();
  }, []);

  const scrollToElement = (elementId) => {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element && modalContentRef.current) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + modalContentRef.current.scrollTop - 100;
        
        modalContentRef.current.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        
        element.classList.add('ring-2', 'ring-[#ff0000]', 'border-[#ff0000]');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-[#ff0000]', 'border-[#ff0000]');
        }, 3000);
      }
    }, 100);
  };

  useEffect(() => {
    if (error && error.includes('fieldId:')) {
      const fieldId = error.split('fieldId:')[1].split('|')[0];
      scrollToElement(fieldId);
    }
  }, [error]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (product) {
        populateFormData();
      }
    }
  }, [isOpen, product]);

  useEffect(() => {
    return cleanupPreviews;
  }, [cleanupPreviews]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await categoriesAPI.getAllCategories();
      
      let categoriesArray = [];
      if (response.data.categories && Array.isArray(response.data.categories)) {
        categoriesArray = response.data.categories;
      } else if (Array.isArray(response.data)) {
        categoriesArray = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        categoriesArray = response.data.data;
      }
      
      setCategories(categoriesArray);
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      setError('Failed to fetch categories');
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const populateFormData = () => {
    if (!product) return;

    console.log('📝 Populating form with product data:', product);
    
    setFormData({
      name: product.name || '',
      slug: product.slug || '',
      description: product.description || '',
      category: product.category?._id || product.category || '',
      seller: product.seller || '',
    });

    // Specifications
    if (product.specifications && Array.isArray(product.specifications) && product.specifications.length > 0) {
      setSpecifications(product.specifications.map(spec => ({
        key: spec.key || '',
        value: spec.value || ''
      })));
    } else {
      setSpecifications([]);
    }

    // Key Features
    if (product.keyFeatures && Array.isArray(product.keyFeatures) && product.keyFeatures.length > 0) {
      setKeyFeatures(product.keyFeatures.filter(feature => typeof feature === 'string' && feature.trim() !== ''));
    } else {
      setKeyFeatures([]);
    }

    // Variants
    if (product.variants && product.variants.length > 0) {
      setVariants(product.variants.map(variant => ({
        variantName: variant.variantName || '',
        price: variant.price || '',
        description: variant.description || '',
        weight: variant.weight || '',
        weightUnit: variant.weightUnit || 'gram',
        stock: variant.stock || '',
        images: variant.images || [],
        sku: variant.sku || '',
        isDefault: variant.isDefault || false,
        features: variant.features || []
      })));
    } else {
      setVariants([]);
    }

    // Reset states
    setVariantImageFiles({});
    setVariantImagePreviews({});
    setNewKeyFeature('');
    setError('');
    setDeletedVariantImages({});
  };

  const resetForm = () => {
    cleanupPreviews();
    
    setFormData({
      name: '', slug: '', description: '', category: '', seller: '',
    });
    setError('');
    setAutoGenerateSlug(true);
    setSpecifications([]);
    setKeyFeatures([]);
    setNewKeyFeature('');
    setExpandedSections({
      basic: true,
      category: true,
      variants: true,
      specifications: false,
      features: false,
    });
    
    Object.values(variantImagePreviews).forEach(previews => {
      previews?.forEach(preview => URL.revokeObjectURL(preview));
    });
    
    setVariants([]);
    setVariantImageFiles({});
    setVariantImagePreviews({});
    setDeletedVariantImages({});
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    const updatedFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };

    if (name === 'name' && autoGenerateSlug) {
      // 🎯 Tamil-safe slug generation
      updatedFormData.slug = generateSlug(value);
    }

    setFormData(updatedFormData);
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...variants];
    
    if (field === 'isDefault') {
      updatedVariants.forEach((v, i) => {
        v.isDefault = i === index;
      });
    } else {
      updatedVariants[index] = {
        ...updatedVariants[index],
        [field]: value
      };
    }
    
    setVariants(updatedVariants);
  };

  const addVariant = () => {
    const variantNumber = variants.length + 1;
    const newVariant = {
      variantName: `Pack ${variantNumber}`,
      price: '',
      description: '',
      weight: '',
      weightUnit: 'gram',
      stock: '',
      images: [],
      sku: '',
      isDefault: variants.length === 0,
      features: []
    };
    
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (index) => {
    if (variantImagePreviews[index]) {
      variantImagePreviews[index].forEach(preview => {
        URL.revokeObjectURL(preview);
        previewUrls.current.delete(preview);
      });
    }
    
    const updatedVariants = [...variants];
    updatedVariants.splice(index, 1);
    
    if (updatedVariants.length > 0 && !updatedVariants.some(v => v.isDefault)) {
      updatedVariants[0].isDefault = true;
    }
    
    setVariants(updatedVariants);
    
    const updatedVariantFiles = {};
    const updatedVariantPreviews = {};
    
    Object.keys(variantImageFiles).forEach(key => {
      const keyNum = parseInt(key);
      if (keyNum < index) {
        updatedVariantFiles[key] = variantImageFiles[key];
        updatedVariantPreviews[key] = variantImagePreviews[key];
      } else if (keyNum > index) {
        updatedVariantFiles[keyNum - 1] = variantImageFiles[key];
        updatedVariantPreviews[keyNum - 1] = variantImagePreviews[key];
      }
    });
    
    setVariantImageFiles(updatedVariantFiles);
    setVariantImagePreviews(updatedVariantPreviews);
  };

  const handleVariantImageChange = (e, variantIndex) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    const currentImages = variantImageFiles[variantIndex] || [];
    const existingCount = variants[variantIndex]?.images?.length || 0;
    
    if (currentImages.length + files.length + existingCount > 10) {
      setError("⚠️ Maximum 10 images allowed per variant");
      if (modalContentRef.current) modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      e.target.value = '';
      return;
    }
    
    const newPreviews = files.map(file => {
      const preview = URL.createObjectURL(file);
      previewUrls.current.add(preview);
      return preview;
    });
    
    setVariantImageFiles(prev => ({
      ...prev,
      [variantIndex]: [...(prev[variantIndex] || []), ...files]
    }));
    
    setVariantImagePreviews(prev => ({
      ...prev,
      [variantIndex]: [...(prev[variantIndex] || []), ...newPreviews]
    }));
    
    setError('');
    
    setTimeout(() => {
      e.target.value = '';
    }, 0);
  };

  const removeVariantImageFile = (variantIndex, imageIndex) => {
    if (variantImagePreviews[variantIndex]?.[imageIndex]) {
      const url = variantImagePreviews[variantIndex][imageIndex];
      URL.revokeObjectURL(url);
      previewUrls.current.delete(url);
    }
    
    setVariantImagePreviews(prev => {
      const updated = { ...prev };
      if (updated[variantIndex]) {
        updated[variantIndex] = updated[variantIndex].filter((_, i) => i !== imageIndex);
      }
      return updated;
    });
    
    setVariantImageFiles(prev => {
      const updated = { ...prev };
      if (updated[variantIndex]) {
        updated[variantIndex] = updated[variantIndex].filter((_, i) => i !== imageIndex);
      }
      return updated;
    });
  };

  const removeExistingVariantImage = (variantIndex, imageIndex) => {
    const updatedVariants = [...variants];
    const imageToDelete = updatedVariants[variantIndex].images[imageIndex];
    
    setDeletedVariantImages(prev => ({
      ...prev,
      [variantIndex]: [...(prev[variantIndex] || []), imageToDelete.image]
    }));
    
    updatedVariants[variantIndex].images = updatedVariants[variantIndex].images.filter(
      (_, idx) => idx !== imageIndex
    );
    setVariants(updatedVariants);
  };

  const handleAddKeyFeature = () => {
    if (newKeyFeature.trim() !== '') {
      setKeyFeatures([...keyFeatures, newKeyFeature.trim()]);
      setNewKeyFeature('');
    }
  };

  const handleRemoveKeyFeature = (index) => {
    const updatedKeyFeatures = [...keyFeatures];
    updatedKeyFeatures.splice(index, 1);
    setKeyFeatures(updatedKeyFeatures);
  };

  const handleSpecificationChange = (index, field, value) => {
    const updatedSpecifications = [...specifications];
    updatedSpecifications[index] = {
      ...updatedSpecifications[index],
      [field]: value
    };
    setSpecifications(updatedSpecifications);
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { key: '', value: '' }]);
  };

  const removeSpecification = (index) => {
    const updatedSpecifications = [...specifications];
    updatedSpecifications.splice(index, 1);
    setSpecifications(updatedSpecifications);
  };

  const handleSlugToggle = (e) => {
    setAutoGenerateSlug(e.target.checked);
    if (e.target.checked && formData.name) {
      // 🎯 Tamil-safe slug generation
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(formData.name)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.name || formData.name.trim() === '') {
      setError('fieldId:product-name|Please enter a product name');
      scrollToElement('product-name');
      return;
    }

    if (!formData.slug || formData.slug.trim() === '') {
      setError('fieldId:product-slug|Please enter a product slug');
      scrollToElement('product-slug');
      return;
    }

    // 🎯 Tamil-safe slug validation — allow Unicode letters, numbers, marks, dashes
    const slugRegex = /^[\p{L}\p{N}\p{M}]+(?:-[\p{L}\p{N}\p{M}]+)*$/u;
    if (!slugRegex.test(formData.slug)) {
      setError('fieldId:product-slug|Slug can only contain letters (any language), numbers, and hyphens');
      scrollToElement('product-slug');
      return;
    }

    if (!formData.category || formData.category === '') {
      setError('fieldId:product-category|Please select a category');
      scrollToElement('product-category');
      return;
    }

    if (!formData.seller || formData.seller.trim() === '') {
      setError('fieldId:product-seller|Please enter a seller name');
      scrollToElement('product-seller');
      return;
    }

    if (variants.length === 0) {
      setError('fieldId:add-variant-button|Please add at least one variant');
      scrollToElement('add-variant-button');
      return;
    }

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      if (!variant.variantName || variant.variantName.trim() === '') {
        setError(`fieldId:variant-name-${i}|Variant #${i + 1} must have a name`);
        scrollToElement(`variant-name-${i}`);
        return;
      }
      if (!variant.price || variant.price === '' || parseFloat(variant.price) <= 0) {
        setError(`fieldId:variant-price-${i}|Variant "${variant.variantName || 'Unnamed'}" must have a valid price`);
        scrollToElement(`variant-price-${i}`);
        return;
      }
      if (!variant.stock || variant.stock === '' || parseInt(variant.stock) < 0) {
        setError(`fieldId:variant-stock-${i}|Variant "${variant.variantName || 'Unnamed'}" must have valid stock quantity`);
        scrollToElement(`variant-stock-${i}`);
        return;
      }
      const hasExistingImages = variant.images && variant.images.length > 0;
      const hasNewImages = variantImageFiles[i] && variantImageFiles[i].length > 0;
      if (!hasExistingImages && !hasNewImages) {
        setError(`fieldId:variant-images-${i}|Variant "${variant.variantName || 'Unnamed'}" must have at least one image`);
        scrollToElement(`variant-images-${i}`);
        return;
      }
      if (!variant.description || variant.description.trim() === '') {
        setError(`fieldId:variant-description-${i}|Variant "${variant.variantName || 'Unnamed'}" must have a description`);
        scrollToElement(`variant-description-${i}`);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      
      // Add basic fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key]);
        }
      });

      if (!formData.description) {
        submitData.append('description', 'Product with multiple variants');
      }

      const defaultVariant = variants.find(v => v.isDefault) || variants[0];
      if (defaultVariant.price) {
        submitData.append('basePrice', defaultVariant.price);
        submitData.append('price', defaultVariant.price);
      }
      
      const totalStock = variants.reduce((sum, variant) => sum + (parseInt(variant.stock) || 0), 0);
      submitData.append('stock', totalStock.toString());
      
      submitData.append('hasOffer', 'false');

      // Send deleted variant images
      if (Object.keys(deletedVariantImages).length > 0) {
        submitData.append('deletedVariantImages', JSON.stringify(deletedVariantImages));
      }

      // Variants data
      const variantsForJson = variants.map(variant => ({
        variantName: variant.variantName.trim(),
        price: parseFloat(variant.price),
        description: variant.description?.trim() || '',
        weight: variant.weight ? parseFloat(variant.weight) : 0,
        weightUnit: variant.weightUnit || 'gram',
        stock: parseInt(variant.stock),
        images: variant.images || [],
        sku: variant.sku?.trim() || '',
        isDefault: variant.isDefault || false,
        features: variant.features || []
      }));
      
      submitData.append('variants', JSON.stringify(variantsForJson));

      // Specifications
      if (specifications.length > 0) {
        const validSpecifications = specifications.filter(spec => 
          spec.key.trim() !== '' && spec.value.trim() !== ''
        );
        if (validSpecifications.length > 0) {
          submitData.append('specifications', JSON.stringify(validSpecifications));
        }
      }

      // Key Features
      if (keyFeatures.length > 0) {
        submitData.append('keyFeatures', JSON.stringify(keyFeatures));
      }

      // Variant images
      Object.entries(variantImageFiles).forEach(([variantIndex, files]) => {
        files.forEach(file => {
          submitData.append(`variants[${variantIndex}].images`, file);
        });
      });

      await onEditProduct(product._id, submitData);
      handleClose();
      
    } catch (err) {
      console.error('❌ Error updating product:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update product');
      if (modalContentRef.current) modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    cleanupPreviews();
    resetForm();
    onClose();
  };

  if (!isOpen || !product) return null;

  const renderCategorySelector = () => (
    <div>
      <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1 flex items-center">
        <Tag size={13} className="mr-1 text-gray-500 sm:w-[14px] sm:h-[14px]" />
        Category <span className="text-red-500 ml-1">*</span>
      </label>
      {categoriesLoading ? (
        <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#ff0000]"></div>
          <span className="text-xs sm:text-sm text-gray-600">Loading categories...</span>
        </div>
      ) : (
        <select
          id="product-category"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000] text-xs sm:text-sm bg-white"
        >
          <option value="">-- Select a category --</option>
          {Array.isArray(categories) && categories.length > 0 ? (
            categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))
          ) : (
            <option value="" disabled>No categories available</option>
          )}
        </select>
      )}
    </div>
  );

  const renderVariantProduct = () => (
    <div className="space-y-3 sm:space-y-4">
      {/* Basic Information */}
      <div className="border border-gray-200 rounded-lg sm:rounded-xl overflow-hidden bg-white">
        <div 
          className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
          onClick={() => toggleSection('basic')}
        >
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center">
            <Info size={14} className="mr-1.5 sm:mr-2 sm:w-[16px] sm:h-[16px] text-gray-500" />
            Basic Information
          </h3>
          {expandedSections.basic ? <ChevronUp size={14} className="sm:w-[16px] sm:h-[16px] text-gray-500" /> : <ChevronDown size={14} className="sm:w-[16px] sm:h-[16px] text-gray-500" />}
        </div>
        
        {expandedSections.basic && (
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="product-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000] text-xs sm:text-sm"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
                  Seller <span className="text-red-500">*</span>
                </label>
                <input
                  id="product-seller"
                  type="text"
                  name="seller"
                  value={formData.seller}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000] text-xs sm:text-sm"
                  placeholder="Enter seller name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="auto-slug"
                      checked={autoGenerateSlug}
                      onChange={handleSlugToggle}
                      className="rounded border-gray-300 text-[#ff0000] focus:ring-[#ff0000] w-3.5 h-3.5 sm:w-4 sm:h-4"
                    />
                    <label htmlFor="auto-slug" className="text-[11px] sm:text-xs text-gray-600">Auto-generate from name</label>
                  </div>
                  <input
                    id="product-slug"
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    disabled={autoGenerateSlug}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000] disabled:bg-gray-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                    placeholder="product-slug"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category */}
      <div className="border border-gray-200 rounded-lg sm:rounded-xl overflow-hidden bg-white">
        <div 
          className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
          onClick={() => toggleSection('category')}
        >
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center">
            <Tag size={14} className="mr-1.5 sm:mr-2 sm:w-[16px] sm:h-[16px] text-gray-500" />
            Category
          </h3>
          {expandedSections.category ? <ChevronUp size={14} className="sm:w-[16px] sm:h-[16px] text-gray-500" /> : <ChevronDown size={14} className="sm:w-[16px] sm:h-[16px] text-gray-500" />}
        </div>
        
        {expandedSections.category && (
          <div className="p-3 sm:p-4">
            {renderCategorySelector()}
            
            {variants.some(v => v.isDefault) && (
              <div className="mt-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-[11px] sm:text-xs text-gray-600 font-medium">Base Selling Price</p>
                <p className="text-lg sm:text-xl font-bold text-gray-800">
                  ₹{variants.find(v => v.isDefault)?.price || '0.00'}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500">From default variant</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Variants Section */}
      <div className="border border-gray-200 rounded-lg sm:rounded-xl overflow-hidden bg-white">
        <div 
          className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
          onClick={() => toggleSection('variants')}
        >
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center">
            <Layers size={14} className="mr-1.5 sm:mr-2 sm:w-[16px] sm:h-[16px] text-gray-500" />
            Product Variants <span className="text-red-500 ml-1">*</span>
          </h3>
          <div className="flex items-center">
            {variants.length > 0 && (
              <span className="mr-2 text-[10px] sm:text-xs bg-gray-200 text-gray-700 px-1.5 sm:px-2 py-0.5 rounded-full">
                {variants.length}
              </span>
            )}
            {expandedSections.variants ? <ChevronUp size={14} className="sm:w-[16px] sm:h-[16px] text-gray-500" /> : <ChevronDown size={14} className="sm:w-[16px] sm:h-[16px] text-gray-500" />}
          </div>
        </div>
        
        {expandedSections.variants && (
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] sm:text-xs text-gray-500">
                Add different packs or options as variants.
              </p>
              <button
                id="add-variant-button"
                type="button"
                onClick={addVariant}
                className="inline-flex items-center px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-white bg-[#ff0000] rounded-lg hover:bg-[#cc0000] transition-colors whitespace-nowrap"
              >
                <Plus size={12} className="mr-1 sm:w-[14px] sm:h-[14px]" />
                Add Variant
              </button>
            </div>
            
            {variants.length === 0 ? (
              <div className="p-4 sm:p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <Layers size={26} className="mx-auto text-gray-400 mb-2 sm:w-[32px] sm:h-[32px]" />
                <p className="text-xs sm:text-sm text-gray-600 mb-3">
                  No variants added yet. Add different packs or options.
                </p>
                <button
                  type="button"
                  onClick={addVariant}
                  className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-[#ff0000] rounded-lg hover:bg-[#cc0000] transition-colors"
                >
                  <Plus size={14} className="mr-1 sm:w-[16px] sm:h-[16px]" />
                  Add Your First Variant
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {variants.map((variant, index) => (
                  <div key={index} className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] sm:text-xs font-medium text-gray-500">Variant #{index + 1}</span>
                        {variant.isDefault && (
                          <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium text-white bg-[#ff0000] rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} className="sm:w-[16px] sm:h-[16px]" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-medium text-gray-500 mb-1">Variant Name *</label>
                        <input
                          id={`variant-name-${index}`}
                          type="text"
                          value={variant.variantName}
                          onChange={(e) => handleVariantChange(index, 'variantName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                          placeholder="e.g. Pack 1, 500g, etc."
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[11px] sm:text-xs font-medium text-gray-500 mb-1">Price (₹) *</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-400 text-xs">₹</span>
                          </div>
                          <input
                            id={`variant-price-${index}`}
                            type="text"
                            value={variant.price}
                            onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-[11px] sm:text-xs font-medium text-gray-500 mb-1">Stock *</label>
                        <input
                          id={`variant-stock-${index}`}
                          type="text"
                          value={variant.stock}
                          onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                          placeholder="0"
                          min="0"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[11px] sm:text-xs font-medium text-gray-500 mb-1">Weight (Optional)</label>
                        <input
                          type="text"
                          value={variant.weight}
                          onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                          placeholder="e.g., 500"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[11px] sm:text-xs font-medium text-gray-500 mb-1">Weight Unit</label>
                        <select
                          value={variant.weightUnit || 'gram'}
                          onChange={(e) => handleVariantChange(index, 'weightUnit', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                        >
                          <option value="gram">Gram (g)</option>
                          <option value="kg">Kilogram (kg)</option>
                          <option value="ml">Milliliter (ml)</option>
                          <option value="liter">Liter (L)</option>
                          <option value="piece">Piece</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-[11px] sm:text-xs font-medium text-gray-500 mb-1">SKU (Optional)</label>
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                          placeholder="Variant SKU"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1.5 sm:mt-2">
                        <input
                          type="checkbox"
                          checked={variant.isDefault}
                          onChange={(e) => handleVariantChange(index, 'isDefault', e.target.checked)}
                          className="rounded border-gray-300 text-[#ff0000] focus:ring-[#ff0000] w-3.5 h-3.5 sm:w-4 sm:h-4"
                        />
                        <span className="text-[11px] sm:text-xs text-gray-600">Set as default variant</span>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-[11px] sm:text-xs font-medium text-gray-500 mb-1">Variant Images *</label>
                        
                        {/* Existing Images */}
                        {variant.images && variant.images.length > 0 && (
                          <div className="mb-2.5 sm:mb-3">
                            <p className="text-[11px] sm:text-xs text-gray-500 mb-2">Existing Images:</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {variant.images.map((img, imgIdx) => {
                                const R2_BASE = import.meta.env.VITE_R2_PUBLIC_URL;
                                const src = img.image.startsWith('http')
                                  ? img.image
                                  : `${R2_BASE}/${img.image}`;

                                return (
                                  <div key={imgIdx} className="relative group">
                                    <div className="w-full aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                                      <img
                                        src={src}
                                        alt={`Variant ${index + 1} - ${imgIdx + 1}`}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeExistingVariantImage(index, imgIdx)}
                                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs shadow-lg hover:bg-red-600"
                                    >
                                      ×
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* New Images Upload */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-2.5 sm:p-3 hover:border-[#ff0000] transition-colors">
                          <input
                            id={`variant-images-${index}`}
                            type="file"
                            multiple
                            onChange={(e) => handleVariantImageChange(e, index)}
                            accept="image/*"
                            className="w-full text-xs sm:text-sm text-gray-500 file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-1.5 file:px-2.5 sm:file:px-3 file:rounded-full file:border-0 file:text-[10px] sm:file:text-xs file:font-medium file:bg-[#ff0000] file:text-white hover:file:bg-[#cc0000]"
                          />
                        </div>
                        
                        {variant.images?.length === 0 && (!variantImagePreviews[index] || variantImagePreviews[index].length === 0) && (
                          <p className="text-[11px] sm:text-xs text-amber-600 mt-1">⚠️ At least one image required</p>
                        )}
                        
                        {/* New Images Preview */}
                        {variantImagePreviews[index]?.length > 0 && (
                          <div className="mt-2.5 sm:mt-3">
                            <p className="text-[11px] sm:text-xs text-gray-500 mb-2">New Images to Upload:</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {variantImagePreviews[index].map((preview, imgIdx) => (
                                <div key={imgIdx} className="relative group">
                                  <div className="w-full aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                                    <img
                                      src={preview}
                                      alt={`New ${imgIdx + 1}`}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeVariantImageFile(index, imgIdx)}
                                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs shadow-lg hover:bg-red-600"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-[11px] sm:text-xs font-medium text-gray-500 mb-1">Variant Description *</label>
                        <textarea
                          id={`variant-description-${index}`}
                          value={variant.description}
                          onChange={(e) => handleVariantChange(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                          placeholder="Describe this variant"
                          rows="2"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Specifications */}
      <div className="border border-gray-200 rounded-lg sm:rounded-xl overflow-hidden bg-white">
        <div 
          className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
          onClick={() => toggleSection('specifications')}
        >
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center">
            <Settings size={14} className="mr-1.5 sm:mr-2 sm:w-[16px] sm:h-[16px] text-gray-500" />
            Specifications (Optional)
          </h3>
          <div className="flex items-center">
            {specifications.length > 0 && (
              <span className="mr-2 text-[10px] sm:text-xs bg-gray-200 text-gray-700 px-1.5 sm:px-2 py-0.5 rounded-full">
                {specifications.length}
              </span>
            )}
            {expandedSections.specifications ? <ChevronUp size={14} className="sm:w-[16px] sm:h-[16px] text-gray-500" /> : <ChevronDown size={14} className="sm:w-[16px] sm:h-[16px] text-gray-500" />}
          </div>
        </div>
        
        {expandedSections.specifications && (
          <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
            {specifications.length > 0 ? (
              <div className="space-y-2.5 sm:space-y-3">
                {specifications.map((spec, index) => (
                  <div key={index} className="p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[11px] sm:text-xs font-medium text-gray-600">Specification #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeSpecification(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      <input
                        type="text"
                        value={spec.key}
                        onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                        placeholder="Key"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                        placeholder="Value"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg text-center border border-gray-200">
                <p className="text-[11px] sm:text-xs text-gray-500">No specifications added yet.</p>
              </div>
            )}
            
            <button
              type="button"
              onClick={addSpecification}
              className="inline-flex items-center px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-white bg-[#ff0000] rounded-lg hover:bg-[#cc0000] transition-colors"
            >
              <Plus size={12} className="mr-1 sm:w-[14px] sm:h-[14px]" />
              Add Specification
            </button>
          </div>
        )}
      </div>

      {/* Key Features */}
      <div className="border border-gray-200 rounded-lg sm:rounded-xl overflow-hidden bg-white">
        <div 
          className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
          onClick={() => toggleSection('features')}
        >
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center">
            <Package size={14} className="mr-1.5 sm:mr-2 sm:w-[16px] sm:h-[16px] text-gray-500" />
            Key Features (Optional)
          </h3>
          <div className="flex items-center">
            {keyFeatures.length > 0 && (
              <span className="mr-2 text-[10px] sm:text-xs bg-gray-200 text-gray-700 px-1.5 sm:px-2 py-0.5 rounded-full">
                {keyFeatures.length}
              </span>
            )}
            {expandedSections.features ? <ChevronUp size={14} className="sm:w-[16px] sm:h-[16px] text-gray-500" /> : <ChevronDown size={14} className="sm:w-[16px] sm:h-[16px] text-gray-500" />}
          </div>
        </div>
        
        {expandedSections.features && (
          <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newKeyFeature}
                onChange={(e) => setNewKeyFeature(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyFeature())}
                placeholder="Enter a key feature"
                className="flex-1 px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000] text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={handleAddKeyFeature}
                disabled={!newKeyFeature.trim()}
                className="inline-flex items-center px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-[#ff0000] rounded-lg hover:bg-[#cc0000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                <Plus size={14} className="mr-1 sm:w-[16px] sm:h-[16px]" />
                Add
              </button>
            </div>
            
            {keyFeatures.length > 0 && (
              <div className="space-y-2 mt-2.5 sm:mt-3">
                {keyFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-xs sm:text-sm text-gray-700 flex-1">{feature}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyFeature(index)}
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] m-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-base sm:text-xl font-semibold text-gray-900 flex items-center">
              <Package size={18} className="mr-1.5 sm:mr-2 sm:w-[20px] sm:h-[20px] text-[#ff0000]" />
              Edit Product
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Product with Variants</p>
          </div>
          <button 
            onClick={handleClose} 
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={16} className="sm:w-[18px] sm:h-[18px] text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1" ref={modalContentRef}>
          {error && !error.includes('fieldId:') && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg shadow-sm">
              <div className="flex items-center">
                <AlertCircle size={16} className="mr-2 sm:w-[18px] sm:h-[18px] text-red-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            {renderVariantProduct()}
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6 mt-4 sm:mt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || categoriesLoading}
              className="inline-flex items-center justify-center px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-[#ff0000] border border-transparent rounded-lg hover:bg-[#cc0000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
            >
              <Save size={14} className="mr-1.5 sm:mr-2 sm:w-[16px] sm:h-[16px]" />
              {loading ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;