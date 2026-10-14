// src/components/AddTermsModal.jsx
import React, { useState } from 'react';
import {
  X, Plus, Trash2, Save, AlertCircle, ChevronDown, ChevronUp,
  FileSignature, Info, ListChecks, GripVertical
} from 'lucide-react';

const AddTermsModal = ({ isOpen, onClose, onAddTerms }) => {
  const [formData, setFormData] = useState({
    termsOfServiceTitle: 'Terms of Service',
    termsImportantNotice:
      'These Terms of Service govern your use of our website and services. By using our website, you acknowledge that you have read, understood, and agree to be bound by these terms.',
    termsUserRequirements: [
      'You must be at least 18 years old to place an order',
      'Payment processing is handled by secure third-party providers',
      'All product images are for illustrative purposes only',
      'Shipping times are estimates and not guarantees',
      'We reserve the right to refuse service to anyone',
    ],
    termsSections: [
      { number: 1, title: 'Agreement to Terms', content: 'By accessing and using our website, you accept and agree to be bound by these Terms of Service.' },
      { number: 2, title: 'User Accounts', content: 'When you create an account with us, you must provide accurate and complete information.' },
      { number: 3, title: 'Product Information', content: 'We make every effort to display as accurately as possible the colors, features, specifications, and details of products available on the Website.' },
      { number: 4, title: 'Orders and Payment', content: 'By placing an order through our Website, you warrant that you are legally capable of entering into binding contracts.' },
      { number: 5, title: 'Shipping and Delivery', content: 'Shipping times and costs will vary depending on your location and the shipping method selected.' },
      { number: 6, title: 'Returns and Refunds', content: 'Please review our Returns Policy for detailed information about returning products.' },
      { number: 7, title: 'Intellectual Property', content: 'All content on this Website is the property of our company.' },
      { number: 8, title: 'Limitation of Liability', content: 'To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special damages.' },
      { number: 9, title: 'Changes to Terms', content: 'We reserve the right to modify these terms at any time.' },
      { number: 10, title: 'Contact Information', content: 'Questions about the Terms of Service should be sent to us at the contact information provided in our website footer.' },
    ],
    termsIntellectualProperty:
      'All content on this Website, including text, graphics, logos, images, and software, is the property of our company or its content suppliers and is protected by copyright and other intellectual property laws.',
    termsLimitationLiability:
      'To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages.',
    termsChangesNotice:
      'We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service on this page.',
    termsContactInfo:
      'Questions about the Terms of Service should be sent to us at the contact information provided in our website footer.',
  });

  const [newRequirement, setNewRequirement] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    notice: true,
    requirements: true,
    sections: false,
    legal: false,
  });

  const toggleSection = (key) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Requirements
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

  // Sections
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

  const resetForm = () => {
    setFormData({
      termsOfServiceTitle: 'Terms of Service',
      termsImportantNotice:
        'These Terms of Service govern your use of our website and services. By using our website, you acknowledge that you have read, understood, and agree to be bound by these terms.',
      termsUserRequirements: [
        'You must be at least 18 years old to place an order',
        'Payment processing is handled by secure third-party providers',
        'All product images are for illustrative purposes only',
        'Shipping times are estimates and not guarantees',
        'We reserve the right to refuse service to anyone',
      ],
      termsSections: [
        { number: 1, title: 'Agreement to Terms', content: 'By accessing and using our website, you accept and agree to be bound by these Terms of Service.' },
        { number: 2, title: 'User Accounts', content: 'When you create an account with us, you must provide accurate and complete information.' },
        { number: 3, title: 'Product Information', content: 'We make every effort to display as accurately as possible the colors, features, specifications, and details of products available on the Website.' },
        { number: 4, title: 'Orders and Payment', content: 'By placing an order through our Website, you warrant that you are legally capable of entering into binding contracts.' },
        { number: 5, title: 'Shipping and Delivery', content: 'Shipping times and costs will vary depending on your location and the shipping method selected.' },
        { number: 6, title: 'Returns and Refunds', content: 'Please review our Returns Policy for detailed information about returning products.' },
        { number: 7, title: 'Intellectual Property', content: 'All content on this Website is the property of our company.' },
        { number: 8, title: 'Limitation of Liability', content: 'To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special damages.' },
        { number: 9, title: 'Changes to Terms', content: 'We reserve the right to modify these terms at any time.' },
        { number: 10, title: 'Contact Information', content: 'Questions about the Terms of Service should be sent to us at the contact information provided in our website footer.' },
      ],
      termsIntellectualProperty:
        'All content on this Website, including text, graphics, logos, images, and software, is the property of our company or its content suppliers and is protected by copyright and other intellectual property laws.',
      termsLimitationLiability:
        'To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages.',
      termsChangesNotice:
        'We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service on this page.',
      termsContactInfo:
        'Questions about the Terms of Service should be sent to us at the contact information provided in our website footer.',
    });
    setError('');
    setNewRequirement('');
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
      await onAddTerms(formData);
      handleClose();
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Failed to add terms of service');
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
              <FileSignature size={18} className="mr-2 text-[#ff0000]" />
              Add Terms of Service
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
              Configure terms of service content
            </p>
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
              {loading ? 'Adding...' : 'Add Terms'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------- Helpers ---------- */
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

export default AddTermsModal;