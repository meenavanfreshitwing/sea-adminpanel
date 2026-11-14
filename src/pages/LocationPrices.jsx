// Location Prices — one table: products/packs as rows, every location as a column.
// Each cell = that location's price (empty → normal price) + "sold here" tick.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, RefreshCw, Save, Search, MapPin, Percent, RotateCcw } from 'lucide-react';
import { FaSignOutAlt } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { locationsAPI } from '../api/locations';

const keyOf = (productId, variantId) => `${productId}:${variantId || ''}`;
const cellKey = (locId, rowKey) => `${locId}|${rowKey}`;
const str = (v) => (v === null || v === undefined ? '' : String(v));
const EMPTY = { price: '', originalPrice: '', isAvailable: true };
const toState = (override) => (override
  ? { price: str(override.price), originalPrice: str(override.originalPrice), isAvailable: override.isAvailable !== false }
  : EMPTY);
const sameState = (a, b) =>
  str(a.price) === str(b.price) && str(a.originalPrice) === str(b.originalPrice) && a.isAvailable === b.isAvailable;
const isDefaultState = (s) => s.price === '' && s.originalPrice === '' && s.isAvailable;
const cleanNumber = (value) => {
  let cleaned = String(value).replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
  return cleaned;
};
const rupees = (n) => (n === null || n === undefined || n === '' ? '—' : `₹${Number(n).toLocaleString('en-IN')}`);

// One API response per location → rows (one per pack) + saved state per cell
const buildGrid = (locations, responses) => {
  const rows = [];
  const base = {};
  const seen = new Set();
  responses.forEach((res, i) => {
    const locId = locations[i]._id;
    for (const p of res.data.data || []) {
      const packs = p.variants?.length ? p.variants : [null];
      packs.forEach((v, idx) => {
        const key = keyOf(p.productId, v?.variantId);
        base[cellKey(locId, key)] = toState(v ? v.override : p.override);
        if (seen.has(key)) return;
        seen.add(key);
        rows.push({
          key,
          productId: p.productId,
          variantId: v?.variantId || null,
          productName: p.name,
          firstOfProduct: idx === 0,
          packName: v ? v.variantName : '—',
          category: p.category,
          inactive: p.status !== 'active' || (v && v.status && v.status !== 'active'),
          defaultPrice: v ? v.defaultPrice : p.defaultPrice,
          defaultOriginalPrice: v ? v.defaultOriginalPrice : p.defaultOriginalPrice,
        });
      });
    }
  });
  return { rows, base };
};

const LocationPrices = () => {
  const { logout } = useAuth();
  const [locations, setLocations] = useState([]);
  const [rows, setRows] = useState([]);
  const [base, setBase] = useState({});
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [showMrp, setShowMrp] = useState(false);
  const [showPaused, setShowPaused] = useState(false);
  const [fillLocation, setFillLocation] = useState('all');
  const [percent, setPercent] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = (await locationsAPI.list()).data.data || [];
      const responses = await Promise.all(list.map(l => locationsAPI.getPrices(l._id)));
      const grid = buildGrid(list, responses);
      setLocations(list);
      setRows(grid.rows);
      setBase(grid.base);
      setEdits({});
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load prices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const columns = useMemo(
    () => locations.filter(l => l.isActive || showPaused),
    [locations, showPaused]
  );

  const stateOf = (locId, rowKey) => {
    const k = cellKey(locId, rowKey);
    return edits[k] || base[k] || EMPTY;
  };
  const isChanged = (locId, rowKey) => {
    const k = cellKey(locId, rowKey);
    return Boolean(edits[k]) && !sameState(edits[k], base[k] || EMPTY);
  };

  const changedCells = useMemo(
    () => Object.keys(edits).filter(k => !sameState(edits[k], base[k] || EMPTY)),
    [edits, base]
  );
  const hasChanges = changedCells.length > 0;

  useEffect(() => {
    if (!hasChanges) return undefined;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

  const edit = (locId, rowKey, field, value) => {
    setNotice('');
    setEdits(prev => {
      const k = cellKey(locId, rowKey);
      return { ...prev, [k]: { ...(prev[k] || base[k] || EMPTY), [field]: value } };
    });
  };
  const resetRow = (row) => {
    setEdits(prev => {
      const next = { ...prev };
      columns.forEach(l => { next[cellKey(l._id, row.key)] = EMPTY; });
      return next;
    });
  };

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(r => [r.productName, r.packName, r.category].some(t => (t || '').toLowerCase().includes(term)));
  }, [rows, search]);

  // Quick fill: normal price ± X % for every shown pack, in one location or all
  const applyPercent = () => {
    const pct = Number(percent);
    if (!percent || isNaN(pct)) return setError('Enter a percentage, e.g. 10 or -5');
    if (pct <= -100) return setError('Percentage must be more than -100');
    const targets = fillLocation === 'all' ? columns : columns.filter(l => l._id === fillLocation);
    setError('');
    setEdits(prev => {
      const next = { ...prev };
      for (const r of visibleRows) {
        for (const l of targets) {
          const k = cellKey(l._id, r.key);
          next[k] = { ...(next[k] || base[k] || EMPTY), price: String(Math.round(Number(r.defaultPrice || 0) * (1 + pct / 100))) };
        }
      }
      return next;
    });
    const where = fillLocation === 'all' ? 'all locations' : targets[0]?.name;
    setNotice(`Filled ${visibleRows.length} packs in ${where} with normal price ${pct > 0 ? '+' : ''}${pct}% — check and press Save`);
  };

  const save = async () => {
    const rowByKey = new Map(rows.map(r => [r.key, r]));
    const byLocation = new Map();
    for (const k of changedCells) {
      const [locId, rowKey] = k.split('|');
      const row = rowByKey.get(rowKey);
      const s = edits[k];
      if (s.price !== '' && !(Number(s.price) > 0)) {
        const loc = locations.find(l => l._id === locId);
        return setError(`Price for ${row.productName} (${row.packName}) in ${loc?.name} must be more than 0`);
      }
      const item = { productId: row.productId, ...(row.variantId ? { variantId: row.variantId } : {}) };
      const payload = s.price === '' && s.isAvailable
        ? { ...item, clear: true }
        : {
            ...item,
            price: s.price === '' ? null : Number(s.price),
            originalPrice: s.originalPrice === '' ? null : Number(s.originalPrice),
            isAvailable: s.isAvailable,
          };
      if (!byLocation.has(locId)) byLocation.set(locId, []);
      byLocation.get(locId).push(payload);
    }

    setSaving(true);
    setError('');
    const saved = [];
    const failed = [];
    for (const [locId, items] of byLocation) {
      const name = locations.find(l => l._id === locId)?.name || 'location';
      try {
        await locationsAPI.savePrices(locId, items);
        saved.push(`${name} (${items.length})`);
      } catch (err) {
        failed.push(`${name}: ${err.response?.data?.message || 'could not save'}`);
      }
    }
    setSaving(false);
    await load();
    if (saved.length) setNotice(`Prices saved — ${saved.join(', ')}`);
    if (failed.length) setError(`Not saved — ${failed.join('; ')}`);
  };

  const changedLocationCount = new Set(changedCells.map(k => k.split('|')[0])).size;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="w-full min-w-0 flex-1">
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold text-gray-800">Location Prices</h1>
            <button
              onClick={logout}
              className="flex items-center rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-white hover:from-red-600 hover:to-red-700"
            >
              <span className="mr-2 hidden sm:inline">Logout</span>
              <FaSignOutAlt />
            </button>
          </div>
        </header>

        <main className="space-y-4 p-4 pb-28 sm:p-6 sm:pb-28">
          {!loading && !locations.length && !error ? (
            <div className="rounded-xl bg-white p-8 text-center text-gray-500 shadow-sm">
              <MapPin className="mx-auto mb-2 text-gray-300" size={32} />
              No locations yet. <Link to="/locations" className="font-medium text-[#ff0000] hover:underline">Add a location</Link> first.
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm xl:flex-row xl:items-end">
                <label className="block flex-1">
                  <span className="mb-1 block text-xs font-medium text-gray-600">Search</span>
                  <div className="relative">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Fish, pack or category"
                      className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                    />
                  </div>
                </label>
                <div>
                  <span className="mb-1 block text-xs font-medium text-gray-600">Quick fill: normal price ±</span>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={fillLocation}
                      onChange={e => setFillLocation(e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                    >
                      <option value="all">All locations</option>
                      {columns.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                    </select>
                    <div className="relative w-24">
                      <input
                        value={percent}
                        onChange={e => setPercent(e.target.value.replace(/[^0-9.-]/g, ''))}
                        placeholder="10"
                        aria-label="Percentage"
                        className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                      />
                      <Percent size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <button
                      onClick={applyPercent}
                      disabled={!visibleRows.length}
                      className="whitespace-nowrap rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={showMrp} onChange={e => setShowMrp(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#ff0000] focus:ring-[#ff0000]" />
                    Show MRP
                  </label>
                  {locations.some(l => !l.isActive) && (
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={showPaused} onChange={e => setShowPaused(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-[#ff0000] focus:ring-[#ff0000]" />
                      Show paused locations
                    </label>
                  )}
                  <span className="hidden items-center gap-3 text-xs text-gray-500 md:flex">
                    <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-100 ring-1 ring-blue-200" /> location price</span>
                    <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-100 ring-1 ring-amber-300" /> unsaved</span>
                    <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-gray-200" /> not sold</span>
                  </span>
                </div>
                <button onClick={load} className="rounded-lg border bg-white p-2 hover:bg-gray-50" aria-label="Reload prices">
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>

              {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              {notice && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}

              {/* Price table: rows = packs, columns = locations */}
              <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full border-separate border-spacing-0 text-sm" style={{ minWidth: 420 + columns.length * 150 }}>
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                      <th className="sticky left-0 z-10 border-b bg-gray-50 px-3 py-2.5 font-medium">Product / Pack</th>
                      <th className="border-b px-3 py-2.5 font-medium">Normal price</th>
                      {columns.map(l => (
                        <th key={l._id} className="border-b border-l px-3 py-2.5 font-medium">
                          <span className="flex items-center gap-1 text-gray-700">
                            <MapPin size={13} className="text-[#ff0000]" /> {l.name}
                          </span>
                          {!l.isActive && <span className="text-[10px] normal-case text-gray-400">paused</span>}
                        </th>
                      ))}
                      <th className="border-b px-2 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {loading && !rows.length ? (
                      <tr><td colSpan={columns.length + 3} className="p-8 text-center text-gray-500">Loading…</td></tr>
                    ) : !visibleRows.length ? (
                      <tr><td colSpan={columns.length + 3} className="p-8 text-center text-gray-500">No products match.</td></tr>
                    ) : visibleRows.map(row => {
                      const rowHasOverrides = columns.some(l => !isDefaultState(stateOf(l._id, row.key)));
                      return (
                        <tr key={row.key} className="group">
                          <td className={`sticky left-0 z-10 border-b bg-white px-3 py-2 align-top group-hover:bg-gray-50 ${row.firstOfProduct ? '' : 'pt-1'}`}>
                            <div className={row.firstOfProduct ? 'font-medium text-gray-800' : 'text-xs text-gray-400'}>
                              {row.productName}
                            </div>
                            <div className="text-xs text-gray-600">
                              {row.packName}
                              {row.inactive && <span className="ml-1 text-gray-400">· inactive</span>}
                            </div>
                          </td>
                          <td className="border-b px-3 py-2 align-top text-gray-600">
                            {rupees(row.defaultPrice)}
                            {row.defaultOriginalPrice > row.defaultPrice && (
                              <div className="text-xs text-gray-400 line-through">{rupees(row.defaultOriginalPrice)}</div>
                            )}
                          </td>
                          {columns.map(l => {
                            const s = stateOf(l._id, row.key);
                            const changed = isChanged(l._id, row.key);
                            const tone = changed
                              ? 'bg-amber-50'
                              : !s.isAvailable ? 'bg-gray-100' : s.price !== '' ? 'bg-blue-50/60' : '';
                            return (
                              <td key={l._id} className={`border-b border-l px-2 py-1.5 align-top ${tone}`}>
                                <div className="flex items-center gap-1.5">
                                  <div className="relative w-24">
                                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                                    <input
                                      inputMode="decimal"
                                      value={s.price}
                                      disabled={!s.isAvailable}
                                      onChange={e => edit(l._id, row.key, 'price', cleanNumber(e.target.value))}
                                      placeholder={str(row.defaultPrice)}
                                      aria-label={`${row.productName} ${row.packName} price in ${l.name}`}
                                      className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-5 pr-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0000] disabled:bg-gray-100 disabled:text-gray-400"
                                    />
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={s.isAvailable}
                                    onChange={e => edit(l._id, row.key, 'isAvailable', e.target.checked)}
                                    title={s.isAvailable ? 'Sold here — untick to hide' : 'Not sold here — tick to sell'}
                                    aria-label={`${row.productName} ${row.packName} sold in ${l.name}`}
                                    className="h-4 w-4 flex-shrink-0 rounded border-gray-300 text-[#ff0000] focus:ring-[#ff0000]"
                                  />
                                </div>
                                {showMrp && s.isAvailable && (
                                  <div className="relative mt-1 w-24">
                                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">MRP</span>
                                    <input
                                      inputMode="decimal"
                                      value={s.originalPrice}
                                      onChange={e => edit(l._id, row.key, 'originalPrice', cleanNumber(e.target.value))}
                                      placeholder="—"
                                      aria-label={`${row.productName} ${row.packName} MRP in ${l.name}`}
                                      className="w-full rounded-md border border-gray-200 bg-white py-1 pl-9 pr-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                                    />
                                  </div>
                                )}
                                {!s.isAvailable && <div className="mt-0.5 text-[10px] text-gray-500">Not sold</div>}
                              </td>
                            );
                          })}
                          <td className="border-b px-2 py-2 align-top">
                            {rowHasOverrides && (
                              <button
                                onClick={() => resetRow(row)}
                                title="Use normal price in every location"
                                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                              >
                                <RotateCcw size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500">
                Empty box = normal price. Untick the box next to a price to stop selling that pack in that location.
                The normal price is changed on the Products page.
              </p>
            </>
          )}
        </main>

        {/* Save bar */}
        {locations.length > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 backdrop-blur lg:left-64">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <span className="flex items-center gap-1.5 text-sm text-gray-600">
                <IndianRupee size={16} className="text-[#ff0000]" />
                {hasChanges
                  ? <><b>{changedCells.length}</b>&nbsp;unsaved change{changedCells.length === 1 ? '' : 's'} in {changedLocationCount} location{changedLocationCount === 1 ? '' : 's'}</>
                  : 'No unsaved changes'}
              </span>
              <div className="flex gap-2">
                {hasChanges && (
                  <button onClick={() => { setEdits({}); setNotice(''); }} className="rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Discard
                  </button>
                )}
                <button
                  onClick={save}
                  disabled={!hasChanges || saving}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#ff0000] to-[#cc0000] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Save size={16} /> {saving ? 'Saving…' : 'Save prices'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPrices;
