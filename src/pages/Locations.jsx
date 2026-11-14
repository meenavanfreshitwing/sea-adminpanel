import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Pencil, Trash2, RefreshCw, IndianRupee, X, Save, AlertTriangle } from 'lucide-react';
import { FaSignOutAlt } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { locationsAPI, clearLocationsCache } from '../api/locations';

const EMPTY_FORM = { name: '', pincodes: '', isActive: true, sortOrder: 0 };

// "630001, 630002\n630003" → ['630001', '630002', '630003']
const splitPincodes = (text) =>
  [...new Set(String(text).split(/[\s,]+/).map(p => p.replace(/\D/g, '')).filter(Boolean))];

const LocationForm = ({ initial, onCancel, onSaved }) => {
  const [form, setForm] = useState(initial
    ? { name: initial.name, pincodes: (initial.pincodes || []).join(', '), isActive: initial.isActive, sortOrder: initial.sortOrder || 0 }
    : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const pins = splitPincodes(form.pincodes);
  const badPins = pins.filter(p => p.length !== 6);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Please enter the location name');
    if (badPins.length) return setError(`Pincodes must be 6 digits: ${badPins.join(', ')}`);
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name.trim(), pincodes: pins, isActive: form.isActive, sortOrder: Number(form.sortOrder) || 0 };
      if (initial) await locationsAPI.update(initial._id, payload);
      else await locationsAPI.create(payload);
      clearLocationsCache();
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save location');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-red-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">{initial ? `Edit ${initial.name}` : 'Add location'}</h2>
        <button type="button" onClick={onCancel} className="rounded p-1 text-gray-400 hover:bg-gray-100" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">Location name *</span>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Karaikudi"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">Display order</span>
          <input
            type="number"
            value={form.sortOrder}
            onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-600">
          Pincodes served <span className="font-normal text-gray-400">(separate with commas or new lines)</span>
        </span>
        <textarea
          rows={3}
          value={form.pincodes}
          onChange={e => setForm(f => ({ ...f, pincodes: e.target.value }))}
          placeholder="630001, 630002, 630003"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
        />
        <span className={`mt-1 block text-xs ${badPins.length ? 'text-red-600' : 'text-gray-500'}`}>
          {pins.length} pincode{pins.length === 1 ? '' : 's'}
          {badPins.length ? ` · not 6 digits: ${badPins.join(', ')}` : ''}
        </span>
      </label>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 text-[#ff0000] focus:ring-[#ff0000]"
        />
        Active — customers can choose this location and order
      </label>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#ff0000] to-[#cc0000] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Save size={16} /> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
};

const Locations = () => {
  const { logout } = useAuth();
  const [locations, setLocations] = useState([]);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | location
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await locationsAPI.list();
      setLocations(res.data.data || []);
      setEnabled(res.data.enabled !== false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (loc) => {
    try {
      await locationsAPI.remove(loc._id);
      clearLocationsCache();
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete location');
    }
  };

  const toggleActive = async (loc) => {
    try {
      await locationsAPI.update(loc._id, { isActive: !loc.isActive });
      clearLocationsCache();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update location');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="w-full min-w-0 flex-1">
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold text-gray-800">Delivery Locations</h1>
            <button
              onClick={logout}
              className="flex items-center rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-white hover:from-red-600 hover:to-red-700"
            >
              <span className="mr-2 hidden sm:inline">Logout</span>
              <FaSignOutAlt />
            </button>
          </div>
        </header>

        <main className="space-y-4 p-4 sm:p-6">
          <div className="rounded-xl bg-white p-4 text-sm text-gray-600 shadow-sm">
            Each location is a list of pincodes you deliver to. Customers pick their location when they open the app
            and see that location's prices. Set prices per location on the{' '}
            <Link to="/location-prices" className="font-medium text-[#ff0000] hover:underline">Location Prices</Link> page.
          </div>

          {!enabled && (
            <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
              <span>
                Location pricing is <b>not live yet</b> — customers still see the normal prices. Add all your locations,
                pincodes and prices first, then ask your developer to switch it on.
              </span>
            </div>
          )}

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          {editing ? (
            <LocationForm
              key={editing === 'new' ? 'new' : editing._id}
              initial={editing === 'new' ? null : editing}
              onCancel={() => setEditing(null)}
              onSaved={() => { setEditing(null); load(); }}
            />
          ) : (
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setEditing('new')}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#ff0000] to-[#cc0000] px-4 py-2 text-sm font-semibold text-white hover:shadow-md"
              >
                <Plus size={16} /> Add location
              </button>
              <button onClick={load} className="rounded-lg border bg-white p-2 hover:bg-gray-50" aria-label="Refresh">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          )}

          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            {loading && !locations.length ? (
              <p className="p-8 text-center text-gray-500">Loading…</p>
            ) : !locations.length ? (
              <div className="p-8 text-center text-gray-500">
                <MapPin className="mx-auto mb-2 text-gray-300" size={32} />
                No locations yet. Add your first one, e.g. Karaikudi with its pincodes.
              </div>
            ) : (
              <ul className="divide-y">
                {locations.map(loc => (
                  <li key={loc._id} className={`p-4 ${loc.isActive ? '' : 'bg-gray-50'}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <MapPin size={16} className="text-[#ff0000]" />
                          <span className="font-semibold text-gray-800">{loc.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs ${loc.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                            {loc.isActive ? 'Active' : 'Paused'}
                          </span>
                          <span className="text-xs text-gray-500">{loc.pincodes?.length || 0} pincodes</span>
                        </div>
                        <p className="mt-1.5 break-words font-mono text-xs text-gray-500">
                          {loc.pincodes?.length ? loc.pincodes.join(', ') : 'No pincodes yet — customers cannot select this location'}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 flex-wrap gap-2">
                        <Link
                          to={`/location-prices?location=${loc._id}`}
                          className="flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50"
                        >
                          <IndianRupee size={15} /> Prices
                        </Link>
                        <button
                          onClick={() => setEditing(loc)}
                          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil size={15} /> Edit
                        </button>
                        <button
                          onClick={() => toggleActive(loc)}
                          className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {loc.isActive ? 'Pause' : 'Activate'}
                        </button>
                        {confirmDelete === loc._id ? (
                          <button onClick={() => remove(loc)} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white">
                            Delete + its prices?
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(loc._id)}
                            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={15} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Tip: use <b>Pause</b> to stop a location for a while — its prices are kept. <b>Delete</b> also removes all its prices.
          </p>
        </main>
      </div>
    </div>
  );
};

export default Locations;
