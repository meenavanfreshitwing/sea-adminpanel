// Add-ons (masala etc.) shown on the checkout page with fish.
// Customers see an add-on only when it is ON, its category is ON and it has stock.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CookingPot, Plus, Pencil, Trash2, RefreshCw, X, Save, Search, ImagePlus, Check, Tag } from 'lucide-react';
import { FaSignOutAlt } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { addonsAPI, addonImageUrl } from '../api/addons';

const errorText = (err, fallback) => err.response?.data?.message || fallback;

const Switch = ({ on, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!on)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${on ? 'bg-green-500' : 'bg-gray-300'}`}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
  </button>
);

// ─────────────────────────────── Categories ───────────────────────────────
const CategoriesPanel = ({ categories, onChanged, setError }) => {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn, fallback) => {
    setBusy(true);
    setError('');
    try { await fn(); await onChanged(); } catch (err) { setError(errorText(err, fallback)); } finally { setBusy(false); }
  };

  const add = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    run(async () => { await addonsAPI.createCategory({ name: newName.trim(), sortOrder: categories.length }); setNewName(''); }, 'Could not add category');
  };
  const saveName = (cat) => run(async () => { await addonsAPI.updateCategory(cat._id, { name: editName.trim() }); setEditingId(null); }, 'Could not rename category');
  const toggle = (cat, isActive) => run(() => addonsAPI.updateCategory(cat._id, { isActive }), 'Could not update category');
  const remove = (cat) => run(async () => { await addonsAPI.deleteCategory(cat._id); setConfirmDelete(null); }, 'Could not delete category');

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Tag size={18} className="text-[#ff0000]" />
        <h2 className="font-semibold text-gray-800">Categories</h2>
        <span className="text-xs text-gray-500">Turn a category off to hide all its add-ons</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <div key={cat._id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${cat.isActive ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50'}`}>
            {editingId === cat._id ? (
              <>
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(cat); if (e.key === 'Escape') setEditingId(null); }}
                  className="w-40 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                  aria-label="Category name"
                />
                <button onClick={() => saveName(cat)} disabled={busy || !editName.trim()} className="rounded p-1 text-green-600 hover:bg-green-50" aria-label="Save name"><Check size={16} /></button>
                <button onClick={() => setEditingId(null)} className="rounded p-1 text-gray-400 hover:bg-gray-100" aria-label="Cancel"><X size={16} /></button>
              </>
            ) : (
              <>
                <span className={`text-sm font-medium ${cat.isActive ? 'text-gray-800' : 'text-gray-400'}`}>{cat.name}</span>
                <span className="rounded-full bg-gray-100 px-1.5 text-[11px] text-gray-500">{cat.addonCount}</span>
                <Switch on={cat.isActive} onChange={v => toggle(cat, v)} label={`${cat.name} on/off`} disabled={busy} />
                <button onClick={() => { setEditingId(cat._id); setEditName(cat.name); }} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label={`Rename ${cat.name}`}>
                  <Pencil size={14} />
                </button>
                {confirmDelete === cat._id ? (
                  <button onClick={() => remove(cat)} disabled={busy} className="rounded bg-red-600 px-2 py-0.5 text-xs text-white">Delete?</button>
                ) : (
                  <button onClick={() => setConfirmDelete(cat._id)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${cat.name}`}>
                    <Trash2 size={14} />
                  </button>
                )}
              </>
            )}
          </div>
        ))}

        <form onSubmit={add} className="flex items-center gap-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="New category, e.g. Marination"
            className="w-56 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
            aria-label="New category name"
          />
          <button type="submit" disabled={busy || !newName.trim()} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">
            <Plus size={15} /> Add
          </button>
        </form>
      </div>
    </section>
  );
};

// ─────────────────────────────── Add-on form ───────────────────────────────
const EMPTY_FORM = { name: '', category: '', price: '', stock: '', description: '', isActive: true };

const AddonForm = ({ addon, categories, onClose, onSaved }) => {
  const [form, setForm] = useState(addon
    ? {
        name: addon.name,
        category: addon.category?._id || '',
        price: String(addon.price ?? ''),
        stock: String(addon.stock ?? ''),
        description: addon.description || '',
        isActive: addon.isActive,
      }
    : { ...EMPTY_FORM, category: categories[0]?._id || '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(addon?.image ? addonImageUrl(addon.image) : null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);

  useEffect(() => () => { if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  const number = (field, decimals) => (e) => {
    let v = e.target.value.replace(decimals ? /[^0-9.]/g : /[^0-9]/g, '');
    if (decimals) { const p = v.split('.'); if (p.length > 2) v = p[0] + '.' + p.slice(1).join(''); }
    setForm(f => ({ ...f, [field]: v }));
  };

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return setError('Please choose an image file');
    if (f.size > 5 * 1024 * 1024) return setError('Image must be smaller than 5 MB');
    setError('');
    setFile(f);
    setRemoveImage(false);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Please enter the add-on name');
    if (!form.category) return setError('Please choose a category');
    if (form.price === '' || isNaN(Number(form.price))) return setError('Please enter the price');
    if (form.stock === '') return setError('Please enter the stock (packets available)');

    const data = new FormData();
    data.append('name', form.name.trim());
    data.append('category', form.category);
    data.append('price', form.price);
    data.append('stock', form.stock);
    data.append('description', form.description.trim());
    data.append('isActive', String(form.isActive));
    if (file) data.append('image', file);
    if (removeImage && !file) data.append('deleteImage', 'true');

    setSaving(true);
    setError('');
    try {
      if (addon) await addonsAPI.update(addon._id, data);
      else await addonsAPI.create(data);
      onSaved();
    } catch (err) {
      setError(errorText(err, 'Could not save add-on'));
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={e => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <CookingPot size={20} className="text-[#ff0000]" /> {addon ? 'Edit add-on' : 'New add-on'}
          </h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100" aria-label="Close"><X size={20} /></button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          {/* Photo */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-[#ff0000]"
              aria-label="Choose photo"
            >
              {preview && !removeImage
                ? <img src={preview} alt="" className="h-full w-full object-cover" />
                : <ImagePlus size={28} className="text-gray-400" />}
            </button>
            <div className="text-sm">
              <button type="button" onClick={() => fileInput.current?.click()} className="font-medium text-[#ff0000] hover:underline">
                {preview && !removeImage ? 'Change photo' : 'Upload photo'}
              </button>
              {preview && !removeImage && (
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreview(null); setRemoveImage(true); if (fileInput.current) fileInput.current.value = ''; }}
                  className="ml-3 text-gray-500 hover:text-red-600"
                >
                  Remove
                </button>
              )}
              <p className="mt-1 text-xs text-gray-500">JPG or PNG, up to 5 MB. Square photos look best.</p>
            </div>
            <input ref={fileInput} type="file" accept="image/*" onChange={pickFile} className="hidden" />
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Name *</span>
            <input value={form.name} onChange={set('name')} placeholder="e.g. Fish Fry Masala 50 g" className={input} />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Category *</span>
            <select value={form.category} onChange={set('category')} className={input}>
              {!categories.length && <option value="">Add a category first</option>}
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}{c.isActive ? '' : ' (off)'}</option>)}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">Price (₹) *</span>
              <input inputMode="decimal" value={form.price} onChange={number('price', true)} placeholder="30" className={input} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">Stock (packets) *</span>
              <input inputMode="numeric" value={form.stock} onChange={number('stock', false)} placeholder="50" className={input} />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">Description</span>
            <textarea
              rows={3}
              maxLength={500}
              value={form.description}
              onChange={set('description')}
              placeholder="e.g. Ready mix for crispy fish fry. Enough for 500 g fish."
              className={input}
            />
          </label>

          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5">
            <span className="text-sm text-gray-700">
              <b>{form.isActive ? 'ON' : 'OFF'}</b> — {form.isActive ? 'shown at checkout' : 'hidden from customers'}
            </span>
            <Switch on={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} label="Show at checkout" />
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button
            type="submit"
            disabled={saving || !categories.length}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#ff0000] to-[#cc0000] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Save size={16} /> {saving ? 'Saving…' : 'Save add-on'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─────────────────────────────── Page ───────────────────────────────
const Addons = () => {
  const { logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editing, setEditing] = useState(null); // null | 'new' | addon
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, list] = await Promise.all([addonsAPI.listCategories(), addonsAPI.list()]);
      setCategories(cats.data.data || []);
      setAddons(list.data.data || []);
    } catch (err) {
      setError(errorText(err, 'Could not load add-ons'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (addon, isActive) => {
    setBusyId(addon._id);
    setError('');
    try {
      await addonsAPI.update(addon._id, { isActive });
      setAddons(list => list.map(a => (a._id === addon._id ? { ...a, isActive } : a)));
    } catch (err) {
      setError(errorText(err, 'Could not update add-on'));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (addon) => {
    setError('');
    try {
      await addonsAPI.remove(addon._id);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(errorText(err, 'Could not delete add-on'));
    }
  };

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return addons.filter(a =>
      (categoryFilter === 'all' || a.category?._id === categoryFilter) &&
      (!term || [a.name, a.description, a.category?.name].some(t => (t || '').toLowerCase().includes(term))));
  }, [addons, search, categoryFilter]);

  const shownCount = addons.filter(a => a.isActive && a.category?.isActive && a.stock > 0).length;

  // Why a customer can't see this add-on (or null if they can)
  const hiddenReason = (a) => {
    if (!a.isActive) return 'Off';
    if (!a.category?.isActive) return 'Category off';
    if (!(a.stock > 0)) return 'Out of stock';
    return null;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="w-full min-w-0 flex-1">
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold text-gray-800">Add-ons</h1>
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
            Add-ons like masala are offered on the checkout page whenever a customer has fish in the cart.
            Customers see every add-on that is <b>ON</b>, in a category that is <b>ON</b>, with stock left.
            <span className="ml-1 font-medium text-gray-800">Showing now: {shownCount} of {addons.length}.</span>
          </div>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <CategoriesPanel categories={categories} onChanged={load} setError={setError} />

          <section className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                <div className="relative sm:w-72">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search add-ons"
                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                  aria-label="Filter by category"
                >
                  <option value="all">All categories</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={load} className="rounded-lg border bg-white p-2 hover:bg-gray-50" aria-label="Refresh">
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={() => setEditing('new')}
                  disabled={!categories.length}
                  title={categories.length ? '' : 'Add a category first'}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#ff0000] to-[#cc0000] px-4 py-2 text-sm font-semibold text-white hover:shadow-md disabled:opacity-50"
                >
                  <Plus size={16} /> Add add-on
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Add-on</th>
                    <th className="px-4 py-2.5 font-medium">Category</th>
                    <th className="px-4 py-2.5 font-medium">Price</th>
                    <th className="px-4 py-2.5 font-medium">Stock</th>
                    <th className="px-4 py-2.5 font-medium">Show at checkout</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading && !addons.length ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading…</td></tr>
                  ) : !visible.length ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        <CookingPot className="mx-auto mb-2 text-gray-300" size={32} />
                        {addons.length ? 'No add-ons match.' : categories.length ? 'No add-ons yet. Click “Add add-on”.' : 'Start by adding a category above, e.g. Marination.'}
                      </td>
                    </tr>
                  ) : visible.map(a => {
                    const reason = hiddenReason(a);
                    const img = addonImageUrl(a.image);
                    return (
                      <tr key={a._id} className={reason ? 'bg-gray-50/70' : ''}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-gray-50">
                              {img ? <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" /> : <CookingPot size={20} className="text-gray-300" />}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-gray-800">{a.name}</div>
                              {a.description && <div className="max-w-xs truncate text-xs text-gray-500" title={a.description}>{a.description}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {a.category?.name || '—'}
                          {a.category && !a.category.isActive && <div className="text-[11px] text-amber-600">category off</div>}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">₹{Number(a.price).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.stock <= 0 ? 'bg-red-100 text-red-700' : a.stock <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                            {a.stock <= 0 ? 'Out of stock' : `${a.stock} left`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Switch on={a.isActive} onChange={v => toggle(a, v)} label={`${a.name} on/off`} disabled={busyId === a._id} />
                            <span className={`text-xs ${reason ? 'text-gray-500' : 'font-medium text-green-700'}`}>
                              {reason ? `Hidden · ${reason}` : 'Shown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditing(a)} className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                              <Pencil size={14} /> Edit
                            </button>
                            {confirmDelete === a._id ? (
                              <button onClick={() => remove(a)} className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs text-white">Confirm delete</button>
                            ) : (
                              <button onClick={() => setConfirmDelete(a._id)} className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50">
                                <Trash2 size={14} /> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500">
              Stock goes down automatically when an order is placed (or paid online) and comes back if the order is cancelled.
              Past orders keep the name and price they were bought at.
            </p>
          </section>
        </main>
      </div>

      {editing && (
        <AddonForm
          addon={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
};

export default Addons;
