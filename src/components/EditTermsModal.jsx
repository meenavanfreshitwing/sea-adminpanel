// src/components/EditTermsModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, Save, AlertCircle, ChevronDown, ChevronUp,
  FileSignature, Info, ListChecks, GripVertical
} from 'lucide-react';

const EditTermsModal = ({ isOpen, onClose, onEditTerms, terms }) => {
  const [formData, setFormData] = useState({
    termsOfServiceTitle: '',
    termsImportantNotice: '',
    termsUserRequirements: [],
    termsSections: [],
    termsIntellectualProperty: '',
    termsLimitationLiability: '',
    termsChangesNotice: '',
    termsContactInfo: '',
  });

  const [newRequirement, setNewRequirement] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    notice: true,
    requirements: true,
    sections: false,
    legal: false,
  });

  const toggleSection = (key) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (terms) {
      setFormData({
        termsOfServiceTitle: terms.termsOfServiceTitle || '',
        termsImportantNotice: terms.termsImportantNotice || '',
        termsUserRequirements: terms.termsUserRequirements || [],
        termsSections: terms.termsSections || [],
        termsIntellectualProperty: terms.termsIntellectualProperty || '',
        termsLimitationLiability: terms.termsLimitationLiability || '',
        termsChangesNotice: terms.termsChangesNotice || '',
        termsContactInfo: terms.termsContactInfo || '',
      });
      setVersion(terms.version);
      setError('');
      setNewRequirement('');
    }
  }, [terms]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData((prev) => ({
        ...prev,
        termsUserRequirements: [...prev.termsUserRequirements, newRequirement.trim()],
      }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (index) => {
    setFormData((prev) => ({
      ...prev,
      termsUserRequirements: prev.termsUserRequirements.filter((_, i) => i !== index),
    }));
  };

  const addSection = () => {
    const newNumber = formData.termsSections.length + 1;
    setFormData((prev) => ({
      ...prev,
      termsSections: [
        ...prev.termsSections,
        { number: newNumber, title: 'New Section', content: 'Section content goes here...' },
      ],
    }));
  };

  const removeSection = (index) => {
    const updated = formData.termsSections
      .filter((_, i) => i !== index)
      .map((section, idx) => ({ ...section, number: idx + 1 }));
    setFormData((prev) => ({ ...prev, termsSections: updated }));
  };

  const handleSectionChange = (index, field, value) => {
    const updated = [...formData.termsSections];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, termsSections: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.termsOfServiceTitle?.trim()) return setError('Title is required');
    for (const section of formData.termsSections) {
      if (!section.title?.trim() || !section.content?.trim()) {
        return setError('All sections must have a title and content');
      }
    }

    setLoading(true);
    try {
      await onEditTerms(formData);
      onClose();
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Failed to update terms of service');
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
              <FileSignature size={18} className="mr-2 text-[#ff0000]" />
              Edit Terms of Service
            </h2>
            {version && (
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                Version {version}
              </p>
            )}
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

          {/* Basic Info */}
          <Section
            title="Basic Information"
            icon={<Info size={14} className="text-gray-500" />}
            expanded={expandedSections.basic}
            onToggle={() => toggleSection('basic')}
          >
            <Input
              label="Terms of Service Title *"
              name="termsOfServiceTitle"
              value={formData.termsOfServiceTitle}
              onChange={handleInputChange}
              placeholder="Enter title"
            />
          </Section>

          {/* Important Notice */}
          <Section
            title="Important Notice"
            icon={<AlertCircle size={14} className="text-gray-500" />}
            expanded={expandedSections.notice}
            onToggle={() => toggleSection('notice')}
          >
            <Textarea
              label="Notice Text"
              name="termsImportantNotice"
              value={formData.termsImportantNotice}
              onChange={handleInputChange}
              rows={4}
              placeholder="Enter important notice"
            />
          </Section>

          {/* User Requirements */}
          <Section
            title={`User Requirements (${formData.termsUserRequirements.length})`}
            icon={<ListChecks size={14} className="text-gray-500" />}
            expanded={expandedSections.requirements}
            onToggle={() => toggleSection('requirements')}
          >
            <SimpleList
              items={formData.termsUserRequirements}
              value={newRequirement}
              setValue={setNewRequirement}
              onAdd={addRequirement}
              onRemove={removeRequirement}
              placeholder="Add a requirement"
            />
          </Section>

          {/* Terms Sections */}
          <Section
            title={`Terms Sections (${formData.termsSections.length})`}
            icon={<GripVertical size={14} className="text-gray-500" />}
            expanded={expandedSections.sections}
            onToggle={() => toggleSection('sections')}
          >
            <div className="space-y-3">
              {formData.termsSections.map((section, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">
                      Section #{section.number}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSection(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                    placeholder="Section title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                  />
                  <textarea
                    value={section.content}
                    onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
                    placeholder="Section content"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addSection}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-[#ff0000] rounded-lg hover:bg-[#cc0000]"
              >
                <Plus size={12} className="mr-1" />
                Add Section
              </button>
            </div>
          </Section>

          {/* Legal Info */}
          <Section
            title="Legal Information"
            icon={<FileSignature size={14} className="text-gray-500" />}
            expanded={expandedSections.legal}
            onToggle={() => toggleSection('legal')}
          >
            <div className="space-y-3">
              <Textarea
                label="Intellectual Property"
                name="termsIntellectualProperty"
                value={formData.termsIntellectualProperty}
                onChange={handleInputChange}
                rows={3}
                placeholder="Intellectual property content"
              />
              <Textarea
                label="Limitation of Liability"
                name="termsLimitationLiability"
                value={formData.termsLimitationLiability}
                onChange={handleInputChange}
                rows={3}
                placeholder="Limitation of liability content"
              />
              <Textarea
                label="Changes Notice"
                name="termsChangesNotice"
                value={formData.termsChangesNotice}
                onChange={handleInputChange}
                rows={3}
                placeholder="Changes notice content"
              />
              <Textarea
                label="Contact Information"
                name="termsContactInfo"
                value={formData.termsContactInfo}
                onChange={handleInputChange}
                rows={3}
                placeholder="Contact information"
              />
            </div>
          </Section>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Updating will create a new version. The previous version
              will be kept for historical records.
            </p>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
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
              {loading ? 'Updating...' : 'Update Terms'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------- Helpers (same as AddTermsModal) ---------- */
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
    {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}
    <input
      {...props}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
    />
  </div>
);

const Textarea = ({ label, rows = 3, ...props }) => (
  <div>
    {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}
    <textarea
      {...props}
      rows={rows}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
    />
  </div>
);

const SimpleList = ({ items, value, setValue, onAdd, onRemove, placeholder }) => (
  <div className="space-y-2">
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
      />
      <button
        type="button"
        onClick={onAdd}
        disabled={!value.trim()}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-[#ff0000] rounded-lg hover:bg-[#cc0000] disabled:opacity-50"
      >
        <Plus size={14} className="mr-1" />
        Add
      </button>
    </div>
    {items.length > 0 && (
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
          >
            <span className="text-sm text-gray-700 flex-1">• {item}</span>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="ml-2 text-gray-400 hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default EditTermsModal;