import React, { useEffect, useState } from 'react';
import { X, Lock, Unlock, Bell, Clock, Calendar, AlertTriangle, Save, RotateCcw } from 'lucide-react';
import { bookingAPI } from '../../api/booking';
import { REASON_PRESETS, STATUS_STYLES, statusKey, formatLong, formatTime, addDays } from './bookingUtils';

const emptyForm = {
  isBlocked: false,
  blockedSlots: [],
  reason: '',
  message: '',
  showNotice: false,
  noticeTitle: '',
  cutoffTime: ''
};

const formFromOverride = (override) => ({
  ...emptyForm,
  ...(override
    ? {
        isBlocked: !!override.isBlocked,
        blockedSlots: override.blockedSlots || [],
        reason: override.reason || '',
        message: override.message || '',
        showNotice: !!override.showNotice,
        noticeTitle: override.noticeTitle || '',
        cutoffTime: override.cutoffTime || ''
      }
    : {})
});

const DateEditorPanel = ({ day, today, config, reasons, onClose, onSaved }) => {
  const [form, setForm] = useState(() => formFromOverride(day.override));
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [rescheduleTarget, setRescheduleTarget] = useState({});

  const isPast = day.date < today;
  const style = STATUS_STYLES[statusKey(day)] || STATUS_STYLES.available;
  const slots = config?.slots || [];

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await bookingAPI.getOrdersForDate(day.date);
      setOrders(res.data.data || []);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    setForm(formFromOverride(day.override));
    setError('');
    setNotice('');
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day.date]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const applyPreset = (reason) => {
    const preset = REASON_PRESETS[reason];
    setForm(prev => ({
      ...prev,
      reason,
      // Only fill in text the admin has not written yet
      message: prev.message || preset?.message || '',
      noticeTitle: prev.noticeTitle || preset?.title || ''
    }));
  };

  const toggleSlot = (slotId) => {
    setForm(prev => ({
      ...prev,
      blockedSlots: prev.blockedSlots.includes(slotId)
        ? prev.blockedSlots.filter(id => id !== slotId)
        : [...prev.blockedSlots, slotId]
    }));
  };

  const save = async () => {
    setError('');
    setNotice('');
    if ((form.isBlocked || form.showNotice) && !form.message.trim()) {
      setError('Please write a message for customers.');
      return;
    }
    setSaving(true);
    try {
      const res = await bookingAPI.updateDate(day.date, form);
      const activeOrders = res.data.existingOrders || 0;
      setNotice(
        form.isBlocked && activeOrders > 0
          ? `Saved. ${activeOrders} existing order(s) on this date were NOT cancelled – review them below.`
          : 'Saved. Customers see the change immediately.'
      );
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this date');
    } finally {
      setSaving(false);
    }
  };

  const reopen = async () => {
    setSaving(true);
    setError('');
    try {
      await bookingAPI.clearDate(day.date);
      setForm(emptyForm);
      setNotice('Date reopened for booking. Notice removed.');
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reopen this date');
    } finally {
      setSaving(false);
    }
  };

  const reschedule = async (order) => {
    const target = rescheduleTarget[order._id];
    if (!target) return;
    try {
      const res = await bookingAPI.rescheduleOrder(order._id, target);
      setNotice(res.data.message);
      loadOrders();
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reschedule order');
    }
  };

  const activeOrders = orders.filter(o => o.orderStatus !== 'cancelled');

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b bg-white px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Delivery date</p>
            <h3 className="text-lg font-bold text-gray-800">{formatLong(day.date)}</h3>
            <span className={`mt-1 inline-flex items-center gap-1.5 text-xs font-medium ${style.text}`}>
              <span className={`h-2 w-2 rounded-full ${style.dot}`} />
              {style.label}
              {day.reason === 'cutoff_passed' && ` (closed at ${formatTime(day.cutoffTime)})`}
            </span>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          {notice && <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</div>}

          {isPast ? (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">This date has passed and can no longer be changed.</p>
          ) : (
            <>
              {/* Block toggle */}
              <section className="rounded-xl border p-4">
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold text-gray-800">
                    {form.isBlocked ? <Lock size={18} className="text-red-600" /> : <Unlock size={18} className="text-green-600" />}
                    Block new orders for this date
                  </span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-red-600"
                    checked={form.isBlocked}
                    onChange={(e) => update('isBlocked', e.target.checked)}
                  />
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Customers will see this date in grey. Existing orders are kept.
                </p>

                {config?.timeSlotsEnabled && !form.isBlocked && slots.length > 0 && (
                  <div className="mt-3 border-t pt-3">
                    <p className="mb-2 text-sm font-medium text-gray-700">Block individual time slots</p>
                    <div className="space-y-1.5">
                      {slots.filter(s => s.isActive).map(slot => (
                        <label key={slot.slotId} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            className="accent-red-600"
                            checked={form.blockedSlots.includes(slot.slotId)}
                            onChange={() => toggleSlot(slot.slotId)}
                          />
                          {slot.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Reason + message */}
              <section className="space-y-3 rounded-xl border p-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Reason</label>
                  <select
                    value={form.reason}
                    onChange={(e) => applyPreset(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                  >
                    <option value="">Select a reason</option>
                    {Object.entries(reasons || {}).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Message for customers</label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                    maxLength={1000}
                    placeholder="Shown when a customer taps this date, and in the notice pop-up"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                  />
                  {form.reason && REASON_PRESETS[form.reason] && form.message !== REASON_PRESETS[form.reason].message && (
                    <button
                      type="button"
                      onClick={() => update('message', REASON_PRESETS[form.reason].message)}
                      className="mt-1 text-xs text-red-600 hover:underline"
                    >
                      Use suggested message
                    </button>
                  )}
                </div>
              </section>

              {/* Notice */}
              <section className="space-y-3 rounded-xl border p-4">
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold text-gray-800">
                    <Bell size={18} className="text-amber-500" />
                    Show notice to customers
                  </span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-amber-500"
                    checked={form.showNotice}
                    onChange={(e) => update('showNotice', e.target.checked)}
                  />
                </label>
                <p className="text-xs text-gray-500">
                  Displays a pop-up on the website and app until this date has passed.
                </p>
                {form.showNotice && (
                  <input
                    type="text"
                    value={form.noticeTitle}
                    onChange={(e) => update('noticeTitle', e.target.value)}
                    maxLength={120}
                    placeholder="Notice title (e.g. Cyclone alert – no delivery)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  />
                )}
              </section>

              {/* Cutoff override */}
              <section className="rounded-xl border p-4">
                <label className="mb-1 flex items-center gap-2 font-semibold text-gray-800">
                  <Clock size={18} className="text-blue-600" />
                  Order cutoff for this date
                </label>
                <p className="mb-2 text-xs text-gray-500">
                  Orders close on {formatLong(addDays(day.date, -1))} at this time.
                  Default is {formatTime(config?.cutoffTime)}.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={form.cutoffTime}
                    onChange={(e) => update('cutoffTime', e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  {form.cutoffTime && (
                    <button type="button" onClick={() => update('cutoffTime', '')} className="text-xs text-gray-500 hover:underline">
                      Use default
                    </button>
                  )}
                </div>
              </section>

              <div className="flex gap-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ff0000] to-[#cc0000] px-4 py-2.5 text-sm font-medium text-white hover:from-[#cc0000] hover:to-[#aa0000] disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                {day.override && (
                  <button
                    onClick={reopen}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    title="Unblock, remove notice and custom cutoff"
                  >
                    <RotateCcw size={16} />
                    Reopen
                  </button>
                )}
              </div>
            </>
          )}

          {/* Booked orders */}
          <section className="rounded-xl border p-4">
            <h4 className="mb-2 flex items-center gap-2 font-semibold text-gray-800">
              <Calendar size={18} className="text-gray-600" />
              Orders for this date ({activeOrders.length})
            </h4>
            {form.isBlocked && activeOrders.length > 0 && (
              <p className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                These orders were placed before the date was blocked. Contact the customers and reschedule
                or cancel them from the Orders page.
              </p>
            )}
            {ordersLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-gray-500">No orders booked for this date.</p>
            ) : (
              <ul className="divide-y">
                {orders.map(order => (
                  <li key={order._id} className="py-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{order.orderId}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${order.orderStatus === 'cancelled' ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-700'}`}>
                        {order.orderStatus}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.name} · {order.shippingAddress?.phone} · ₹{order.finalAmount} · {order.paymentMethod?.toUpperCase()}
                      {order.deliverySlot?.label && ` · ${order.deliverySlot.label}`}
                    </div>
                    {order.bookingReview?.required && (
                      <div className="mt-1 text-xs font-medium text-amber-700">Needs review: {order.bookingReview.reason}</div>
                    )}
                    {!['cancelled', 'delivered'].includes(order.orderStatus) && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <input
                          type="date"
                          min={today}
                          value={rescheduleTarget[order._id] || ''}
                          onChange={(e) => setRescheduleTarget(prev => ({ ...prev, [order._id]: e.target.value }))}
                          className="rounded border border-gray-300 px-2 py-1 text-xs"
                        />
                        <button
                          onClick={() => reschedule(order)}
                          disabled={!rescheduleTarget[order._id]}
                          className="rounded bg-gray-800 px-2.5 py-1 text-xs text-white disabled:opacity-40"
                        >
                          Move
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
};

export default DateEditorPanel;
