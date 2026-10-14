// src/components/EditPrivacyModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, Save, AlertCircle, ChevronDown, ChevronUp,
  Shield, Info, ListChecks, GripVertical, Lock, Link as LinkIcon
} from 'lucide-react';

const EditPrivacyModal = ({ isOpen, onClose, onEditPrivacy, privacy }) => {
  const [formData, setFormData] = useState({
    privacyPolicyTitle: '',
    privacyIntroduction: '',
    privacyDataCollection: [],
    privacyDataUsage: [],
    privacyDataSharing: [],
    privacyDataSecurity: '',
    privacyUserRights: [],
    privacyCookies: '',
    privacyThirdPartyLinks: '',
    privacyPolicyChanges: '',
    privacyContactInfo: '',
    privacySections: [],
  });

  const [newCollection, setNewCollection] = useState('');
  const [newUsage, setNewUsage] = useState('');
  const [newSharing, setNewSharing] = useState('');
  const [newRight, setNewRight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    collection: false,
    usage: false,
    sharing: false,
    rights: false,
    sections: false,
    legal: false,
  });

  const toggleSection = (key) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (privacy) {
      setFormData({
        privacyPolicyTitle: privacy.privacyPolicyTitle || '',
        privacyIntroduction: privacy.privacyIntroduction || '',
        privacyDataCollection: privacy.privacyDataCollection || [],
        privacyDataUsage: privacy.privacyDataUsage || [],
        privacyDataSharing: privacy.privacyDataSharing || [],
        privacyDataSecurity: privacy.privacyDataSecurity || '',
        privacyUserRights: privacy.privacyUserRights || [],
        privacyCookies: privacy.privacyCookies || '',
        privacyThirdPartyLinks: privacy.privacyThirdPartyLinks || '',
        privacyPolicyChanges: privacy.privacyPolicyChanges || '',
        privacyContactInfo: privacy.privacyContactInfo || '',
        privacySections: privacy.privacySections || [],
      });
      setVersion(privacy.version);
      setError('');
    }
  }, [privacy]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addArrayItem = (arrayName, value, setter) => {
    if (value.trim()) {
      setFormData((prev) => ({ ...prev, [arrayName]: [...prev[arrayName], value.trim()] }));
      setter('');
    }
  };

  const removeArrayItem = (arrayName, index) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index),
    }));
  };

  const handleSectionChange = (index, field, value) => {
    const updated = [...formData.privacySections];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, privacySections: updated }));
  };

  const addSection = () => {
    setFormData((prev) => ({
      ...prev,
      privacySections: [
        ...prev.privacySections,
        { number: prev.privacySections.length + 1, title: '', content: '' },
      ],
    }));
  };

  const removeSection = (index) => {
    const updated = formData.privacySections
      .filter((_, i) => i !== index)
      .map((s, idx) => ({ ...s, number: idx + 1 }));
    setFormData((prev) => ({ ...prev, privacySections: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.privacyPolicyTitle?.trim()) return setError('Title is required');
    for (const section of formData.privacySections) {
      if (!section.title?.trim() || !section.content?.trim()) {
        return setError('All sections must have a title and content');
      }
    }

    setLoading(true);
    try {
      await onEditPrivacy(formData);
      onClose();
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Failed to update privacy policy');
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
              <Shield size={18} className="mr-2 text-[#ff0000]" />
              Edit Privacy Policy
            </h2>
            {version && <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Version {version}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full">
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

          <Section title="Basic Information" icon={<Info size={14} className="text-gray-500" />} expanded={expandedSections.basic} onToggle={() => toggleSection('basic')}>
            <Input label="Privacy Policy Title *" name="privacyPolicyTitle" value={formData.privacyPolicyTitle} onChange={handleInputChange} />
            <Textarea label="Introduction" name="privacyIntroduction" value={formData.privacyIntroduction} onChange={handleInputChange} rows={3} />
          </Section>

          <Section title={`Information We Collect (${formData.privacyDataCollection.length})`} icon={<ListChecks size={14} className="text-gray-500" />} expanded={expandedSections.collection} onToggle={() => toggleSection('collection')}>
            <SimpleList items={formData.privacyDataCollection} value={newCollection} setValue={setNewCollection} onAdd={() => addArrayItem('privacyDataCollection', newCollection, setNewCollection)} onRemove={(i) => removeArrayItem('privacyDataCollection', i)} placeholder="Add item" />
          </Section>

          <Section title={`How We Use Your Information (${formData.privacyDataUsage.length})`} icon={<ListChecks size={14} className="text-gray-500" />} expanded={expandedSections.usage} onToggle={() => toggleSection('usage')}>
            <SimpleList items={formData.privacyDataUsage} value={newUsage} setValue={setNewUsage} onAdd={() => addArrayItem('privacyDataUsage', newUsage, setNewUsage)} onRemove={(i) => removeArrayItem('privacyDataUsage', i)} placeholder="Add item" />
          </Section>

          <Section title={`Information Sharing (${formData.privacyDataSharing.length})`} icon={<LinkIcon size={14} className="text-gray-500" />} expanded={expandedSections.sharing} onToggle={() => toggleSection('sharing')}>
            <SimpleList items={formData.privacyDataSharing} value={newSharing} setValue={setNewSharing} onAdd={() => addArrayItem('privacyDataSharing', newSharing, setNewSharing)} onRemove={(i) => removeArrayItem('privacyDataSharing', i)} placeholder="Add item" />
          </Section>

          <Section title={`Your Privacy Rights (${formData.privacyUserRights.length})`} icon={<Shield size={14} className="text-gray-500" />} expanded={expandedSections.rights} onToggle={() => toggleSection('rights')}>
            <SimpleList items={formData.privacyUserRights} value={newRight} setValue={setNewRight} onAdd={() => addArrayItem('privacyUserRights', newRight, setNewRight)} onRemove={(i) => removeArrayItem('privacyUserRights', i)} placeholder="Add right" />
          </Section>

          <Section title={`Policy Sections (${formData.privacySections.length})`} icon={<GripVertical size={14} className="text-gray-500" />} expanded={expandedSections.sections} onToggle={() => toggleSection('sections')}>
            <div className="space-y-3">
              {formData.privacySections.map((section, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Section #{section.number}</span>
                    <button type="button" onClick={() => removeSection(index)} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input type="text" value={section.title} onChange={(e) => handleSectionChange(index, 'title', e.target.value)} placeholder="Section title" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]" />
                  <textarea value={section.content} onChange={(e) => handleSectionChange(index, 'content', e.target.value)} placeholder="Section content" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]" />
                </div>
              ))}
              <button type="button" onClick={addSection} className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-[#ff0000] rounded-lg hover:bg-[#cc0000]">
                <Plus size={12} className="mr-1" />
                Add Section
              </button>
            </div>
          </Section>

          <Section title="Legal Information" icon={<Lock size={14} className="text-gray-500" />} expanded={expandedSections.legal} onToggle={() => toggleSection('legal')}>
            <Textarea label="Data Security" name="privacyDataSecurity" value={formData.privacyDataSecurity} onChange={handleInputChange} rows={3} />
            <Textarea label="Cookies Policy" name="privacyCookies" value={formData.privacyCookies} onChange={handleInputChange} rows={3} />
            <Textarea label="Third Party Links" name="privacyThirdPartyLinks" value={formData.privacyThirdPartyLinks} onChange={handleInputChange} rows={3} />
            <Textarea label="Policy Changes" name="privacyPolicyChanges" value={formData.privacyPolicyChanges} onChange={handleInputChange} rows={3} />
            <Textarea label="Contact Information" name="privacyContactInfo" value={formData.privacyContactInfo} onChange={handleInputChange} rows={3} />
          </Section>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Updating will create a new version. The previous version will be kept for historical records.
            </p>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-[#ff0000] rounded-lg hover:bg-[#cc0000] disabled:opacity-50">
              <Save size={16} className="mr-2" />
              {loading ? 'Updating...' : 'Update Privacy Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* Helpers — identical to AddPrivacyModal */
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

const SimpleList = ({ items, value, setValue, onAdd, onRemove, placeholder }) => (
  <div className="space-y-2">
    <div className="flex gap-2">
      <input type="text" value={value} onChange={(e) => setValue(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())} placeholder={placeholder} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]" />
      <button type="button" onClick={onAdd} disabled={!value.trim()} className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-[#ff0000] rounded-lg hover:bg-[#cc0000] disabled:opacity-50">
        <Plus size={14} className="mr-1" />
        Add
      </button>
    </div>
    {items.length > 0 && (
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-700 flex-1">• {item}</span>
            <button type="button" onClick={() => onRemove(i)} className="ml-2 text-gray-400 hover:text-red-500">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default EditPrivacyModal;