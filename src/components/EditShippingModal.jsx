// src/components/EditShippingModal.jsx
import React, { useState, useEffect } from 'react';
import { shippingAPI } from '../api/shipping';
import {
  X, Plus, Trash2, Truck, Info, MapPin, Package,
  Save, AlertCircle, ChevronDown, ChevronUp, DollarSign, CheckCircle
} from 'lucide-react';

const EditShippingModal = ({ isOpen, onClose, onSuccess, shippingId }) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    headerBadge: '',
    headerSubtitle: '',
  });
  const [deliveryPromise, setDeliveryPromise] = useState({ title: '', description: '' });
  const [deliveryAreas, setDeliveryAreas] = useState([]);
  const [shippingCharges, setShippingCharges] = useState({
    isFree: true,
    freeShippingMessage: '',
    freeShippingDescription: '',
    chargeTiers: [],
  });
  const [packaging, setPackaging] = useState({ title: '', items: [] });
  const [orderTracking, setOrderTracking] = useState({
    title: '',
    description: '',
    highlight: '',
  });
  const [newPackagingItem, setNewPackagingItem] = useState('');
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

  // Load data
  useEffect(() => {
    if (isOpen && shippingId) {
      loadShipping();
    }
  }, [isOpen, shippingId]);

  const loadShipping = async () => {
    setFetching(true);
    setError('');
    try {
      const res = await shippingAPI.getShippingById(shippingId);
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setFormData({
          title: d.title || '',
          headerBadge: d.headerBadge || '',
          headerSubtitle: d.headerSubtitle || '',
        });
        setDeliveryPromise(d.deliveryPromise || { title: '', description: '' });
        setDeliveryAreas(d.deliveryAreas || []);
        setShippingCharges(
          d.shippingCharges || {
            isFree: true,
            freeShippingMessage: '',
            freeShippingDescription: '',
            chargeTiers: [],
          }
        );
        setPackaging(d.packaging || { title: '', items: [] });
        setOrderTracking(d.orderTracking || { title: '', description: '', highlight: '' });
      } else {
        setError('Shipping info not found');
      }
    } catch (err) {
      console.error('❌ Fetch shipping error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load shipping info');
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addDeliveryArea = () =>
    setDeliveryAreas([...deliveryAreas, { areaName: '', timing: '' }]);

  const removeDeliveryArea = (index) =>
    setDeliveryAreas(deliveryAreas.filter((_, i) => i !== index));

  const handleAreaChange = (index, field, value) => {
    const updated = [...deliveryAreas];
    updated[index][field] = value;
    setDeliveryAreas(updated);
  };

  const addPackagingItem = () => {
    if (newPackagingItem.trim()) {
      setPackaging({
        ...packaging,
        items: [...(packaging.items || []), newPackagingItem.trim()],
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

      const res = await shippingAPI.updateShipping(shippingId, payload);
      if (res.data?.success) {
        onSuccess?.(res.data.data);
        onClose();
      } else {
        setError(res.data?.message || 'Failed to update shipping info');
      }
    } catch (err) {
      console.error('❌ Update shipping error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update shipping info');
    } finally {
      setLoading(false);
    }
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
              Edit Shipping Info
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Update shipping page content</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {fetching ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff0000]" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle size={16} className="mr-2 text-red-500" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            <Section
              title="Basic Information"
              icon={<Info size={14} className="text-gray-500" />}
              expanded={expandedSections.basic}
              onToggle={() => toggleSection('basic')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Page Title *" name="title" value={formData.title} onChange={handleInputChange} />
                <Input label="Header Badge" name="headerBadge" value={formData.headerBadge} onChange={handleInputChange} />
                <div className="md:col-span-2">
                  <Textarea label="Header Subtitle" name="headerSubtitle" value={formData.headerSubtitle} onChange={handleInputChange} rows={2} />
                </div>
              </div>
            </Section>

            <Section
              title="Delivery Promise"
              icon={<CheckCircle size={14} className="text-gray-500" />}
              expanded={expandedSections.promise}
              onToggle={() => toggleSection('promise')}
            >
              <div className="space-y-3">
                <Input label="Promise Title *" value={deliveryPromise.title} onChange={(e) => setDeliveryPromise({ ...deliveryPromise, title: e.target.value })} />
                <Textarea label="Promise Description *" value={deliveryPromise.description} onChange={(e) => setDeliveryPromise({ ...deliveryPromise, description: e.target.value })} rows={3} />
              </div>
            </Section>

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
                      placeholder="Area name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                    />
                    <input
                      type="text"
                      value={area.timing}
                      onChange={(e) => handleAreaChange(i, 'timing', e.target.value)}
                      placeholder="Timing"
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
                    onChange={(e) => setShippingCharges({ ...shippingCharges, isFree: e.target.checked })}
                    className="rounded border-gray-300 text-[#ff0000] focus:ring-[#ff0000]"
                  />
                  <span className="text-sm text-gray-700">Free shipping for all orders</span>
                </div>
                {shippingCharges.isFree && (
                  <>
                    <Input
                      label="Free Shipping Message"
                      value={shippingCharges.freeShippingMessage}
                      onChange={(e) => setShippingCharges({ ...shippingCharges, freeShippingMessage: e.target.value })}
                    />
                    <Textarea
                      label="Free Shipping Description"
                      value={shippingCharges.freeShippingDescription}
                      onChange={(e) => setShippingCharges({ ...shippingCharges, freeShippingDescription: e.target.value })}
                      rows={3}
                    />
                  </>
                )}
              </div>
            </Section>

            <Section
              title={`Packaging (${packaging.items?.length || 0})`}
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
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPackagingItem())}
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
                {packaging.items?.length > 0 && (
                  <div className="space-y-2">
                    {packaging.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-sm text-gray-700 flex-1">{item}</span>
                        <button type="button" onClick={() => removePackagingItem(i)} className="ml-2 text-gray-400 hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Section>

            <Section
              title="Order Tracking"
              icon={<Truck size={14} className="text-gray-500" />}
              expanded={expandedSections.tracking}
              onToggle={() => toggleSection('tracking')}
            >
              <div className="space-y-3">
                <Input label="Section Title" value={orderTracking.title} onChange={(e) => setOrderTracking({ ...orderTracking, title: e.target.value })} />
                <Textarea label="Description" value={orderTracking.description} onChange={(e) => setOrderTracking({ ...orderTracking, description: e.target.value })} rows={3} />
                <Input label="Highlight" value={orderTracking.highlight} onChange={(e) => setOrderTracking({ ...orderTracking, highlight: e.target.value })} />
              </div>
            </Section>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-[#ff0000] rounded-lg hover:bg-[#cc0000] disabled:opacity-50">
                <Save size={16} className="mr-2" />
                {loading ? 'Updating...' : 'Update Shipping Info'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/* Reuse the same small helpers as AddShippingModal */
const Section = ({ title, icon, expanded, onToggle, children }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer border-b border-gray-200" onClick={onToggle}>
      <h3 className="text-sm font-medium text-gray-700 flex items-center">
        <span className="mr-2">{icon}</span>
        {title}
      </h3>
      {expanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
    </div>
    {expanded && <div className="p-4 space-y-3">{children}</div>}
  </div>
);

const Input = ({ label, ...props }) => (
  <div>
    {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}
    <input {...props} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]" />
  </div>
);

const Textarea = ({ label, rows = 3, ...props }) => (
  <div>
    {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}
    <textarea {...props} rows={rows} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]" />
  </div>
);

export default EditShippingModal;