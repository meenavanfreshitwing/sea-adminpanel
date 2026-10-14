// src/components/AddReturnModal.jsx
import React, { useState } from 'react';
import { returnsAPI } from '../api/returns';
import {
  X, Plus, Trash2, RotateCcw, Info, ListChecks, CheckCircle,
  XCircle, Clock, Package, Save, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';

const AddReturnModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: 'Returns & Refunds',
    headerBadge: 'Freshness Guaranteed',
    headerSubtitle: "Not happy with your fish? We'll make it right. Our hassle-free returns ensure you get the quality you deserve.",
  });

  const [returnsPolicy, setReturnsPolicy] = useState({
    title: "Not Fresh? We'll Replace or Refund.",
    description: "If your fish doesn't arrive fresh, or isn't what you ordered, contact us within 4 hours of delivery. We'll arrange a replacement or issue a full refund—no questions asked.",
  });

  const [returnSteps, setReturnSteps] = useState([
    { stepNumber: 1, title: 'Contact Us Within 4 Hours', description: 'Call or email our support team with your order number and photos of the issue.' },
  ]);

  const [eligibleItems, setEligibleItems] = useState([
    'Fish not fresh or spoiled',
    'Wrong item delivered',
  ]);

  const [nonEligibleItems, setNonEligibleItems] = useState([
    'Change of mind after delivery',
  ]);

  const [refundTimeline, setRefundTimeline] = useState([
    { method: 'Credit/Debit Card', timeline: '3-5 business days' },
  ]);

  const [contact, setContact] = useState({
    title: 'Need Help?',
    description: 'Our support team is here to help with returns, refunds, or any questions.',
  });

  const [newEligible, setNewEligible] = useState('');
  const [newNonEligible, setNewNonEligible] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    basic: true, policy: true, steps: true, eligible: false,
    nonEligible: false, refund: false, contact: false,
  });

  const toggleSection = (key) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Steps
  const addStep = () => {
    setReturnSteps([
      ...returnSteps,
      { stepNumber: returnSteps.length + 1, title: '', description: '' },
    ]);
  };
  const removeStep = (i) => {
    const updated = returnSteps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    setReturnSteps(updated);
  };
  const handleStepChange = (i, field, value) => {
    const updated = [...returnSteps];
    updated[i][field] = value;
    setReturnSteps(updated);
  };

  // Eligible / Non-eligible
  const addEligible = () => {
    if (newEligible.trim()) {
      setEligibleItems([...eligibleItems, newEligible.trim()]);
      setNewEligible('');
    }
  };
  const addNonEligible = () => {
    if (newNonEligible.trim()) {
      setNonEligibleItems([...nonEligibleItems, newNonEligible.trim()]);
      setNewNonEligible('');
    }
  };

  // Refund timeline
  const addRefund = () =>
    setRefundTimeline([...refundTimeline, { method: '', timeline: '' }]);
  const removeRefund = (i) =>
    setRefundTimeline(refundTimeline.filter((_, idx) => idx !== i));
  const handleRefundChange = (i, field, value) => {
    const updated = [...refundTimeline];
    updated[i][field] = value;
    setRefundTimeline(updated);
  };

  const resetForm = () => {
    setFormData({
      title: 'Returns & Refunds',
      headerBadge: 'Freshness Guaranteed',
      headerSubtitle: "Not happy with your fish? We'll make it right. Our hassle-free returns ensure you get the quality you deserve.",
    });
    setReturnsPolicy({
      title: "Not Fresh? We'll Replace or Refund.",
      description: "If your fish doesn't arrive fresh, or isn't what you ordered, contact us within 4 hours of delivery. We'll arrange a replacement or issue a full refund—no questions asked.",
    });
    setReturnSteps([{ stepNumber: 1, title: 'Contact Us Within 4 Hours', description: 'Call or email our support team with your order number and photos of the issue.' }]);
    setEligibleItems(['Fish not fresh or spoiled', 'Wrong item delivered']);
    setNonEligibleItems(['Change of mind after delivery']);
    setRefundTimeline([{ method: 'Credit/Debit Card', timeline: '3-5 business days' }]);
    setContact({ title: 'Need Help?', description: 'Our support team is here to help with returns, refunds, or any questions.' });
    setError('');
    setNewEligible('');
    setNewNonEligible('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title?.trim()) return setError('Title is required');
    if (!returnsPolicy.title?.trim()) return setError('Returns policy title is required');
    if (!returnsPolicy.description?.trim()) return setError('Returns policy description is required');
    if (returnSteps.some((s) => !s.title?.trim() || !s.description?.trim())) {
      return setError('All return steps must have a title and description');
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        headerBadge: formData.headerBadge.trim(),
        headerSubtitle: formData.headerSubtitle.trim(),
        returnsPolicy,
        returnSteps,
        eligibleItems,
        nonEligibleItems,
        refundTimeline,
        contact,
      };
      const res = await returnsAPI.createReturnPolicy(payload);
      if (res.data?.success) {
        onSuccess?.(res.data.data);
        handleClose();
      } else {
        setError(res.data?.message || 'Failed to create return policy');
      }
    } catch (err) {
      console.error('❌ Create return error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create return policy');
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
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-white">
          <div>
            <h2 className="text-base sm:text-xl font-semibold text-gray-900 flex items-center">
              <RotateCcw size={18} className="mr-2 text-[#ff0000]" />
              Add Return Policy
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Configure returns page content</p>
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

          {/* Basic */}
          <Section title="Basic Information" icon={<Info size={14} className="text-gray-500" />} expanded={expandedSections.basic} onToggle={() => toggleSection('basic')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Page Title *" name="title" value={formData.title} onChange={handleInputChange} />
              <Input label="Header Badge" name="headerBadge" value={formData.headerBadge} onChange={handleInputChange} />
              <div className="md:col-span-2">
                <Textarea label="Header Subtitle" name="headerSubtitle" value={formData.headerSubtitle} onChange={handleInputChange} rows={2} />
              </div>
            </div>
          </Section>

          {/* Policy */}
          <Section title="Returns Policy" icon={<CheckCircle size={14} className="text-gray-500" />} expanded={expandedSections.policy} onToggle={() => toggleSection('policy')}>
            <div className="space-y-3">
              <Input label="Policy Title *" value={returnsPolicy.title} onChange={(e) => setReturnsPolicy({ ...returnsPolicy, title: e.target.value })} />
              <Textarea label="Policy Description *" value={returnsPolicy.description} onChange={(e) => setReturnsPolicy({ ...returnsPolicy, description: e.target.value })} rows={3} />
            </div>
          </Section>

          {/* Steps */}
          <Section title={`Return Steps (${returnSteps.length})`} icon={<ListChecks size={14} className="text-gray-500" />} expanded={expandedSections.steps} onToggle={() => toggleSection('steps')}>
            <div className="space-y-3">
              {returnSteps.map((step, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Step #{step.stepNumber}</span>
                    <button type="button" onClick={() => removeStep(i)} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => handleStepChange(i, 'title', e.target.value)}
                    placeholder="Step title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                  />
                  <textarea
                    value={step.description}
                    onChange={(e) => handleStepChange(i, 'description', e.target.value)}
                    placeholder="Step description"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                  />
                </div>
              ))}
              <button type="button" onClick={addStep} className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-[#ff0000] rounded-lg hover:bg-[#cc0000]">
                <Plus size={12} className="mr-1" />
                Add Step
              </button>
            </div>
          </Section>

          {/* Eligible */}
          <Section title={`Eligible Items (${eligibleItems.length})`} icon={<CheckCircle size={14} className="text-gray-500" />} expanded={expandedSections.eligible} onToggle={() => toggleSection('eligible')}>
            <SimpleList items={eligibleItems} value={newEligible} setValue={setNewEligible} onAdd={addEligible} onRemove={(i) => setEligibleItems(eligibleItems.filter((_, idx) => idx !== i))} placeholder="Add eligible item" />
          </Section>

          {/* Non-Eligible */}
          <Section title={`Not Eligible Items (${nonEligibleItems.length})`} icon={<XCircle size={14} className="text-gray-500" />} expanded={expandedSections.nonEligible} onToggle={() => toggleSection('nonEligible')}>
            <SimpleList items={nonEligibleItems} value={newNonEligible} setValue={setNewNonEligible} onAdd={addNonEligible} onRemove={(i) => setNonEligibleItems(nonEligibleItems.filter((_, idx) => idx !== i))} placeholder="Add non-eligible item" />
          </Section>

          {/* Refund Timeline */}
          <Section title={`Refund Timeline (${refundTimeline.length})`} icon={<Clock size={14} className="text-gray-500" />} expanded={expandedSections.refund} onToggle={() => toggleSection('refund')}>
            <div className="space-y-2">
              {refundTimeline.map((row, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="text"
                    value={row.method}
                    onChange={(e) => handleRefundChange(i, 'method', e.target.value)}
                    placeholder="Payment method"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                  />
                  <input
                    type="text"
                    value={row.timeline}
                    onChange={(e) => handleRefundChange(i, 'timeline', e.target.value)}
                    placeholder="Timeline"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                  />
                  <button type="button" onClick={() => removeRefund(i)} className="self-end sm:self-center text-gray-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addRefund} className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-[#ff0000] rounded-lg hover:bg-[#cc0000]">
                <Plus size={12} className="mr-1" />
                Add Row
              </button>
            </div>
          </Section>

          {/* Contact */}
          <Section title="Contact Section" icon={<Package size={14} className="text-gray-500" />} expanded={expandedSections.contact} onToggle={() => toggleSection('contact')}>
            <div className="space-y-3">
              <Input label="Contact Title" value={contact.title} onChange={(e) => setContact({ ...contact, title: e.target.value })} />
              <Textarea label="Contact Description" value={contact.description} onChange={(e) => setContact({ ...contact, description: e.target.value })} rows={2} />
            </div>
          </Section>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
            <button type="button" onClick={handleClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-[#ff0000] rounded-lg hover:bg-[#cc0000] disabled:opacity-50">
              <Save size={16} className="mr-2" />
              {loading ? 'Creating...' : 'Create Return Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* Helpers */
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
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
      />
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

export default AddReturnModal;