// src/components/AddDeliveryBoyModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, User, Phone, Mail, Lock, MapPin, Car, Truck, UserPlus } from 'lucide-react';

const AddDeliveryBoyModal = ({ isOpen, onClose, onAddDeliveryBoy, wards = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    city: '',            // ✅ NEW: which city the selected wards belong to
    wardIds: [],
    areas: [],
    vehicleType: 'bike',
    vehicleNumber: ''
  });

  const [areaInput, setAreaInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ Group wards by city
  const wardsByCity = useMemo(() => {
    const grouped = {};
    for (const ward of wards) {
      const cityKey = (ward.city || 'karaikudi').toLowerCase();
      if (!grouped[cityKey]) grouped[cityKey] = [];
      grouped[cityKey].push(ward);
    }
    return grouped;
  }, [wards]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        city: '',
        wardIds: [],
        areas: [],
        vehicleType: 'bike',
        vehicleNumber: ''
      });
      setAreaInput('');
      setError('');
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Toggle ward, but also enforce single-city selection
  const handleWardToggle = (wardId, wardCity) => {
    setFormData(prev => {
      const cityKey = (wardCity || 'karaikudi').toLowerCase();
      const isSelected = prev.wardIds.some(id => String(id) === String(wardId));

      // ---- UNSELECT ----
      if (isSelected) {
        const nextWardIds = prev.wardIds.filter(id => String(id) !== String(wardId));
        return {
          ...prev,
          wardIds: nextWardIds,
          // if no wards left, clear the city too
          city: nextWardIds.length === 0 ? '' : prev.city
        };
      }

      // ---- SELECT ----
      // If a ward from a different city is already selected, block it
      if (prev.city && prev.city !== cityKey) {
        setError(`You can only assign wards from one city. Currently selected city: ${prev.city}. Clear wards first to switch city.`);
        return prev;
      }

      setError('');
      return {
        ...prev,
        city: cityKey,                       // ✅ lock to this city
        wardIds: [...prev.wardIds, wardId]
      };
    });
  };

  const addArea = (rawValue) => {
    const value = rawValue.trim();
    if (!value) return;
    const exists = formData.areas.some(a => a.toLowerCase() === value.toLowerCase());
    if (exists) {
      setAreaInput('');
      return;
    }
    setFormData(prev => ({ ...prev, areas: [...prev.areas, value] }));
    setAreaInput('');
  };

  const removeArea = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      areas: prev.areas.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleAreaKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addArea(areaInput);
    } else if (e.key === 'Backspace' && areaInput === '' && formData.areas.length > 0) {
      removeArea(formData.areas.length - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.name.trim()) { setError('Name is required'); setLoading(false); return; }
    if (!formData.email.trim()) { setError('Email is required'); setLoading(false); return; }
    if (!formData.phone.trim()) { setError('Phone number is required'); setLoading(false); return; }
    if (!formData.password.trim()) { setError('Password is required'); setLoading(false); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }

    let finalAreas = [...formData.areas];
    if (areaInput.trim()) {
      const pending = areaInput.trim();
      const exists = finalAreas.some(a => a.toLowerCase() === pending.toLowerCase());
      if (!exists) finalAreas.push(pending);
    }

    if (formData.wardIds.length === 0 && finalAreas.length === 0) {
      setError('Please select at least one ward or add at least one area');
      setLoading(false);
      return;
    }

    // ✅ Must have city if wards selected
    if (formData.wardIds.length > 0 && !formData.city) {
      setError('City is required when wards are selected');
      setLoading(false);
      return;
    }

    try {
      const deliveryBoyData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        city: formData.city,             // ✅ SEND CITY
        wardIds: formData.wardIds,       // ✅ interpreted under `city`
        areas: finalAreas,
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber.trim()
      };

      await onAddDeliveryBoy(deliveryBoyData);
      onClose();
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'Failed to add delivery boy');
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-3 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg sm:rounded-xl w-full max-w-md shadow-xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-4 sm:px-5 py-3 border-b sticky top-0 bg-white z-10">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Truck size={18} className="sm:w-[20px] sm:h-[20px] text-[#ff0000]" />
            Add Delivery Boy
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#ff0000] transition-colors p-1"
          >
            <X size={18} className="sm:w-[20px] sm:h-[20px]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 sm:space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs sm:text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={16} className="sm:w-[18px] sm:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0000] focus:border-transparent text-xs sm:text-sm"
                placeholder="Enter full name"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail size={16} className="sm:w-[18px] sm:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0000] focus:border-transparent text-xs sm:text-sm"
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone size={16} className="sm:w-[18px] sm:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0000] focus:border-transparent text-xs sm:text-sm"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock size={16} className="sm:w-[18px] sm:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0000] focus:border-transparent text-xs sm:text-sm"
                placeholder="Min 6 characters"
              />
            </div>
          </div>

          {/* ✅ Ward checkboxes grouped by city */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Assign Wards <span className="text-gray-400 font-normal">(optional if areas given)</span>
            </label>

            {/* ✅ Show which city is currently locked in */}
            {formData.city && (
              <div className="mb-2 flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                <span className="text-xs sm:text-sm text-red-700">
                  Selected city: <b className="uppercase">{formData.city}</b>
                </span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, city: '', wardIds: [] }))}
                  className="text-xs text-red-600 hover:text-red-800 underline"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="border border-gray-300 rounded-lg p-2.5 sm:p-3 max-h-64 overflow-y-auto space-y-4">
              {Object.keys(wardsByCity).length === 0 ? (
                <p className="text-xs sm:text-sm text-gray-500 text-center">Loading wards...</p>
              ) : (
                Object.entries(wardsByCity).map(([cityKey, cityWards]) => {
                  const cityDisabled = !!formData.city && formData.city !== cityKey;
                  return (
                    <div key={cityKey} className={cityDisabled ? 'opacity-40 pointer-events-none' : ''}>
                      <div className="text-[11px] sm:text-xs font-bold text-[#ff0000] uppercase tracking-wide mb-2 border-b border-gray-200 pb-1">
                        {cityKey.charAt(0).toUpperCase() + cityKey.slice(1)} ({cityWards.length} wards)
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        {cityWards.map((ward) => (
                          <label
                            key={`${cityKey}-${ward.wardId}`}
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={formData.wardIds.some(id => String(id) === String(ward.wardId))}
                              onChange={() => handleWardToggle(ward.wardId, cityKey)}
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ff0000] rounded focus:ring-[#ff0000] flex-shrink-0"
                            />
                            <span className="text-xs sm:text-sm text-gray-700">
                              Ward {ward.wardId} - {ward.wardName}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
              Selected: {formData.wardIds.length} ward(s)
            </p>
          </div>

          {/* Areas chip input */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Cities <span className="text-gray-400 font-normal">(optional if wards given)</span>
            </label>

            {formData.areas.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {formData.areas.map((area, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                  >
                    <MapPin size={10} />
                    {area}
                    <button
                      type="button"
                      onClick={() => removeArea(idx)}
                      className="ml-0.5 hover:text-orange-900 transition-colors"
                      aria-label={`Remove ${area}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <MapPin size={16} className="sm:w-[18px] sm:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
                onKeyDown={handleAreaKeyDown}
                onBlur={() => areaInput.trim() && addArea(areaInput)}
                className="w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0000] focus:border-transparent text-xs sm:text-sm"
                placeholder="Type an area and press Enter"
              />
            </div>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
              Press <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px]">Enter</kbd> or <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px]">,</kbd> to add • Click × to remove
            </p>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
            <div className="relative">
              <Car size={16} className="sm:w-[18px] sm:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                className="w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0000] focus:border-transparent text-xs sm:text-sm appearance-none bg-white"
              >
                <option value="bike">Bike</option>
                <option value="scooter">Scooter</option>
                <option value="car">Car</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Vehicle Number (Optional)
            </label>
            <div className="relative">
              <Truck size={16} className="sm:w-[18px] sm:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                className="w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0000] focus:border-transparent text-xs sm:text-sm"
                placeholder="e.g., TN-01-AB-1234"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-2 pt-3 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-3 sm:py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 active:scale-[0.98] transition-all touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 px-4 py-3 sm:py-2 text-sm font-medium text-white bg-[#ff0000] rounded-lg hover:bg-[#cc0000] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation flex items-center justify-center gap-2"
            >
              {loading ? (
                'Adding...'
              ) : (
                <>
                  <UserPlus size={16} />
                  Add Delivery Boy
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDeliveryBoyModal;