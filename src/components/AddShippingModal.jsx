// src/components/AddShippingModal.jsx
import React, { useState } from 'react';
import { shippingAPI } from '../api/shipping';
import {
  X, Plus, Trash2, Truck, Info, MapPin, Package,
  Save, AlertCircle, ChevronDown, ChevronUp, DollarSign, CheckCircle
} from 'lucide-react';

const AddShippingModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: 'Shipping Information',
    headerBadge: 'Fresh Fish Delivered Next Day',
    headerSubtitle: 'We ensure your seafood arrives fresh, fast, and perfectly chilled. Order today and get your fish tomorrow — with free delivery!',
  });

  const [deliveryPromise, setDeliveryPromise] = useState({
    title: 'Order by 2 PM, Get It Tomorrow',
    description: "Place your order before 2:00 PM local time and we'll deliver your fresh catch the very next day. All orders are packed in insulated, eco-friendly boxes with ice packs to maintain perfect temperature.",
  });

  const [deliveryAreas, setDeliveryAreas] = useState([
    { areaName: 'Metro Cities', timing: 'Next-day delivery before 12:00 PM' },
  ]);

  const [shippingCharges, setShippingCharges] = useState({
    isFree: true,
    freeShippingMessage: 'FREE Shipping on All Orders',
    freeShippingDescription: 'No minimum order value. No hidden charges. Every order — big or small — gets free delivery, because fresh fish should be affordable for everyone.',
    chargeTiers: [],
  });

  const [packaging, setPackaging] = useState({
    title: 'How We Pack Your Fish',
    items: [
      'Food-grade insulated boxes',
      'Gel ice packs to maintain 0-4°C',
      'Vacuum-sealed for freshness',
      'Leak-proof and eco-friendly packaging',
      'Temperature monitoring during transit',
      'Contactless delivery available',
    ],
  });

  const [orderTracking, setOrderTracking] = useState({
    title: 'Track Your Order',
    description: "Once your order is shipped, you'll receive an SMS and email with a tracking link. You can also track your order in real-time from your account dashboard.",
    highlight: 'Real-time tracking with delivery ETA updates',
  });

  const [newPackagingItem, setNewPackagingItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    promise: true,
    areas: true,
    charges: true,
    packaging: false,
    tracking: false,
  });

  const toggleSection = (key) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Delivery Areas
  const addDeliveryArea = () => {
    setDeliveryAreas([...deliveryAreas, { areaName: '', timing: '' }]);
  };

  const removeDeliveryArea = (index) => {
    setDeliveryAreas(deliveryAreas.filter((_, i) => i !== index));
  };

  const handleAreaChange = (index, field, value) => {
    const updated = [...deliveryAreas];
    updated[index][field] = value;
    setDeliveryAreas(updated);
  };

  // Packaging items
  const addPackagingItem = () => {
    if (newPackagingItem.trim()) {
      setPackaging({
        ...packaging,
        items: [...packaging.items, newPackagingItem.trim()],
      });
      setNewPackagingItem('');
    }
  };

  const removePackagingItem = (index) => {
    setPackaging({
      ...packaging,
      items: packaging.items.filter((_, i) => i !== index),
    });
  };

  const resetForm = () => {
    setFormData({
      title: 'Shipping Information',
      headerBadge: 'Fresh Fish Delivered Next Day',
      headerSubtitle: 'We ensure your seafood arrives fresh, fast, and perfectly chilled. Order today and get your fish tomorrow — with free delivery!',
    });
    setDeliveryPromise({
      title: 'Order by 2 PM, Get It Tomorrow',
      description: "Place your order before 2:00 PM local time and we'll deliver your fresh catch the very next day. All orders are packed in insulated, eco-friendly boxes with ice packs to maintain perfect temperature.",
    });
    setDeliveryAreas([{ areaName: 'Metro Cities', timing: 'Next-day delivery before 12:00 PM' }]);
    setShippingCharges({
      isFree: true,
      freeShippingMessage: 'FREE Shipping on All Orders',
      freeShippingDescription: 'No minimum order value. No hidden charges. Every order — big or small — gets free delivery, because fresh fish should be affordable for everyone.',
      chargeTiers: [],
    });
    setPackaging({
      title: 'How We Pack Your Fish',
      items: [
        'Food-grade insulated boxes',
        'Gel ice packs to maintain 0-4°C',
        'Vacuum-sealed for freshness',
        'Leak-proof and eco-friendly packaging',
        'Temperature monitoring during transit',
        'Contactless delivery available',
      ],
    });
    setOrderTracking({
      title: 'Track Your Order',
      description: "Once your order is shipped, you'll receive an SMS and email with a tracking link. You can also track your order in real-time from your account dashboard.",
      highlight: 'Real-time tracking with delivery ETA updates',
    });
    setError('');
    setNewPackagingItem('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title?.trim()) return setError('Title is required');
    if (!deliveryPromise.title?.trim()) return setError('Delivery promise title is required');
    if (!deliveryPromise.description?.trim()) return setError('Delivery promise description is required');
    if (deliveryAreas.some((a) => !a.areaName?.trim() || !a.timing?.trim())) {
      return setError('All delivery areas must have a name and timing');
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        headerBadge: formData.headerBadge.trim(),
        headerSubtitle: formData.headerSubtitle.trim(),
        deliveryPromise,
        deliveryAreas,
        shippingCharges,
        packaging,
        orderTracking,
      };

      const res = await shippingAPI.createShipping(payload);
      if (res.data?.success) {
        onSuccess?.(res.data.data);
        handleClose();
      } else {
        setError(res.data?.message || 'Failed to create shipping info');
      }
    } catch (err) {
      console.error('❌ Create shipping error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create shipping info');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-white">
          <div>
            <h2 className="text-base sm:text-xl font-semibold text-gray-900 flex items-center">
              <Truck size={18} className="mr-2 text-[#ff0000]" />
              Add Shipping Info
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Configure the shipping page content</p>
          </div>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-full">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <AlertCircle size={16} className="mr-2 text-red-500" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <Section
            title="Basic Information"
            icon={<Info size={14} className="text-gray-500" />}
            expanded={expandedSections.basic}
            onToggle={() => toggleSection('basic')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Page Title *"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
              />
              <Input
                label="Header Badge"
                name="headerBadge"
                value={formData.headerBadge}
                onChange={handleInputChange}
              />
              <div className="md:col-span-2">
                <Textarea
                  label="Header Subtitle"
                  name="headerSubtitle"
                  value={formData.headerSubtitle}
                  onChange={handleInputChange}
                  rows={2}
                />
              </div>
            </div>
          </Section>

          {/* Delivery Promise */}
          <Section
            title="Delivery Promise"
            icon={<CheckCircle size={14} className="text-gray-500" />}
            expanded={expandedSections.promise}
            onToggle={() => toggleSection('promise')}
          >
            <div className="space-y-3">
              <Input
                label="Promise Title *"
                value={deliveryPromise.title}
                onChange={(e) => setDeliveryPromise({ ...deliveryPromise, title: e.target.value })}
              />
              <Textarea
                label="Promise Description *"
                value={deliveryPromise.description}
                onChange={(e) => setDeliveryPromise({ ...deliveryPromise, description: e.target.value })}
                rows={3}
              />
            </div>
          </Section>

          {/* Delivery Areas */}
          <Section
            title={`Delivery Areas (${deliveryAreas.length})`}
            icon={<MapPin size={14} className="text-gray-500" />}
            expanded={expandedSections.areas}
            onToggle={() => toggleSection('areas')}
          >
            <div className="space-y-2">
              {deliveryAreas.map((area, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="text"
                    value={area.areaName}
                    onChange={(e) => handleAreaChange(i, 'areaName', e.target.value)}
                    placeholder="Area name (e.g. Metro Cities)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                  />
                  <input
                    type="text"
                    value={area.timing}
                    onChange={(e) => handleAreaChange(i, 'timing', e.target.value)}
                    placeholder="Timing (e.g. Next-day before 12 PM)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                  />
                  <button
                    type="button"
                    onClick={() => removeDeliveryArea(i)}
                    className="self-end sm:self-center text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addDeliveryArea}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-[#ff0000] rounded-lg hover:bg-[#cc0000]"
              >
                <Plus size={12} className="mr-1" />
                Add Area
              </button>
            </div>
          </Section>

          {/* Shipping Charges */}
          <Section
            title="Shipping Charges"
            icon={<DollarSign size={14} className="text-gray-500" />}
            expanded={expandedSections.charges}
            onToggle={() => toggleSection('charges')}
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={shippingCharges.isFree}
                  onChange={(e) =>
                    setShippingCharges({ ...shippingCharges, isFree: e.target.checked })
                  }
                  className="rounded border-gray-300 text-[#ff0000] focus:ring-[#ff0000]"
                />
                <span className="text-sm text-gray-700">Free shipping for all orders</span>
              </div>

              {shippingCharges.isFree ? (
                <>
                  <Input
                    label="Free Shipping Message"
                    value={shippingCharges.freeShippingMessage}
                    onChange={(e) =>
                      setShippingCharges({
                        ...shippingCharges,
                        freeShippingMessage: e.target.value,
                      })
                    }
                  />
                  <Textarea
                    label="Free Shipping Description"
                    value={shippingCharges.freeShippingDescription}
                    onChange={(e) =>
                      setShippingCharges({
                        ...shippingCharges,
                        freeShippingDescription: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </>
              ) : (
                <p className="text-xs text-gray-500">Charge tiers can be added later.</p>
              )}
            </div>
          </Section>

          {/* Packaging */}
          <Section
            title={`Packaging (${packaging.items.length})`}
            icon={<Package size={14} className="text-gray-500" />}
            expanded={expandedSections.packaging}
            onToggle={() => toggleSection('packaging')}
          >
            <div className="space-y-3">
              <Input
                label="Section Title"
                value={packaging.title}
                onChange={(e) => setPackaging({ ...packaging, title: e.target.value })}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPackagingItem}
                  onChange={(e) => setNewPackagingItem(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), addPackagingItem())
                  }
                  placeholder="Add packaging item"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                />
                <button
                  type="button"
                  onClick={addPackagingItem}
                  disabled={!newPackagingItem.trim()}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-[#ff0000] rounded-lg hover:bg-[#cc0000] disabled:opacity-50"
                >
                  <Plus size={14} className="mr-1" />
                  Add
                </button>
              </div>
              {packaging.items.length > 0 && (
                <div className="space-y-2">
                  {packaging.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-sm text-gray-700 flex-1">{item}</span>
                      <button
                        type="button"
                        onClick={() => removePackagingItem(i)}
                        className="ml-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* Order Tracking */}
          <Section
            title="Order Tracking"
            icon={<Truck size={14} className="text-gray-500" />}
            expanded={expandedSections.tracking}
            onToggle={() => toggleSection('tracking')}
          >
            <div className="space-y-3">
              <Input
                label="Section Title"
                value={orderTracking.title}
                onChange={(e) => setOrderTracking({ ...orderTracking, title: e.target.value })}
              />
              <Textarea
                label="Description"
                value={orderTracking.description}
                onChange={(e) =>
                  setOrderTracking({ ...orderTracking, description: e.target.value })
                }
                rows={3}
              />
              <Input
                label="Highlight"
                value={orderTracking.highlight}
                onChange={(e) => setOrderTracking({ ...orderTracking, highlight: e.target.value })}
              />
            </div>
          </Section>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-[#ff0000] rounded-lg hover:bg-[#cc0000] disabled:opacity-50"
            >
              <Save size={16} className="mr-2" />
              {loading ? 'Creating...' : 'Create Shipping Info'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------- Small reusable helpers ---------- */

const Section = ({ title, icon, expanded, onToggle, children }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
    <div
      className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
      onClick={onToggle}
    >
      <h3 className="text-sm font-medium text-gray-700 flex items-center">
        <span className="mr-2">{icon}</span>
        {title}
      </h3>
      {expanded ? (
        <ChevronUp size={16} className="text-gray-500" />
      ) : (
        <ChevronDown size={16} className="text-gray-500" />
      )}
    </div>
    {expanded && <div className="p-4 space-y-3">{children}</div>}
  </div>
);

const Input = ({ label, ...props }) => (
  <div>
    {label && (
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    )}
    <input
      {...props}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
    />
  </div>
);

const Textarea = ({ label, rows = 3, ...props }) => (
  <div>
    {label && (
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    )}
    <textarea
      {...props}
      rows={rows}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
    />
  </div>
);

export default AddShippingModal;