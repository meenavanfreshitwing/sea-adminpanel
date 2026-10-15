import React, { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { bookingAPI } from '../../api/booking';
import { formatTime } from './bookingUtils';

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `slot-${Date.now()}`;

const BookingRulesModal = ({ config, onClose, onSaved }) => {
  const [form, setForm] = useState({
    bookingEnabled: config.bookingEnabled,
    cutoffTime: config.cutoffTime,
    maxAdvanceDays: config.maxAdvanceDays,
    closedMessage: config.closedMessage,
    timeSlotsEnabled: config.timeSlotsEnabled,
    slots: (config.slots || []).map(s => ({ ...s }))
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const updateSlot = (index, field, value) =>
    setForm(prev => ({ ...prev, slots: prev.slots.map((s, i) => (i === index ? { ...s, [field]: value } : s)) }));

  const addSlot = () =>
    setForm(prev => ({
      ...prev,
      slots: [...prev.slots, { slotId: '', label: '', startTime: '12:00', endTime: '15:00', isActive: true }]
    }));

  const removeSlot = (index) =>
    setForm(prev => ({ ...prev, slots: prev.slots.filter((_, i) => i !== index) }));

  const save = async () => {
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        maxAdvanceDays: parseInt(form.maxAdvanceDays),
        // New slots get an id from their label; existing ids never change
        slots: form.slots.map(s => ({ ...s, slotId: s.slotId || slugify(s.label) }))
      };
      await bookingAPI.updateConfig(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save booking rules');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-lg font-bold text-gray-800">Booking rules</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <label className="flex cursor-pointer items-center justify-between rounded-xl border p-4">
            <span>
              <span className="block font-semibold text-gray-800">Accept new orders</span>
              <span className="text-xs text-gray-500">Turn off to stop all bookings until you turn it back on.</span>
            </span>
            <input type="checkbox" className="h-5 w-5 accent-green-600" checked={form.bookingEnabled} onChange={(e) => update('bookingEnabled', e.target.checked)} />
          </label>

          {!form.bookingEnabled && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Message shown while bookings are off</label>
              <textarea
                rows={2}
                value={form.closedMessage}
                onChange={(e) => update('closedMessage', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Daily order cutoff</label>
              <input
                type="time"
                value={form.cutoffTime}
                onChange={(e) => update('cutoffTime', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Orders for tomorrow close today at {formatTime(form.cutoffTime) || '—'}.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Book up to (days ahead)</label>
              <input
                type="number"
                min={1}
                max={365}
                value={form.maxAdvanceDays}
                onChange={(e) => update('maxAdvanceDays', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <label className="flex cursor-pointer items-center justify-between">
              <span>
                <span className="block font-semibold text-gray-800">Time-slot booking</span>
                <span className="text-xs text-gray-500">Customers also choose a delivery slot.</span>
              </span>
              <input type="checkbox" className="h-5 w-5 accent-blue-600" checked={form.timeSlotsEnabled} onChange={(e) => update('timeSlotsEnabled', e.target.checked)} />
            </label>

            <div className="mt-3 space-y-2 border-t pt-3">
              {form.slots.map((slot, index) => (
                <div key={index} className="flex flex-wrap items-center gap-2">
                  <input
                    type="checkbox"
                    title="Active"
                    className="accent-blue-600"
                    checked={slot.isActive}
                    onChange={(e) => updateSlot(index, 'isActive', e.target.checked)}
                  />
                  <input
                    type="text"
                    placeholder="Label"
                    value={slot.label}
                    onChange={(e) => updateSlot(index, 'label', e.target.value)}
                    className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                  <input type="time" value={slot.startTime} onChange={(e) => updateSlot(index, 'startTime', e.target.value)} className="rounded border border-gray-300 px-1 py-1 text-sm" />
                  <span className="text-gray-400">–</span>
                  <input type="time" value={slot.endTime} onChange={(e) => updateSlot(index, 'endTime', e.target.value)} className="rounded border border-gray-300 px-1 py-1 text-sm" />
                  <button onClick={() => removeSlot(index)} className="p-1 text-gray-400 hover:text-red-600" aria-label="Remove slot">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button onClick={addSlot} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                <Plus size={14} /> Add slot
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#ff0000] to-[#cc0000] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save rules'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingRulesModal;
