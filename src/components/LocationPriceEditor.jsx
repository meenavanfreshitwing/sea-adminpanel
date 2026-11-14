// Per-location prices for one pack, shown inside the Add/Edit product forms.
// Empty price = the pack's normal price is used in that location.
import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { loadLocationsOnce } from '../api/locations';

const cleanNumber = (value) => {
  let cleaned = String(value).replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
  return cleaned;
};

const LocationPriceEditor = ({ value = [], defaultPrice, onChange }) => {
  const [locations, setLocations] = useState([]);
  const [open, setOpen] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let alive = true;
    loadLocationsOnce()
      .then(list => { if (alive) setLocations(list); })
      .catch(() => { if (alive) setLoadError('Could not load locations'); });
    return () => { alive = false; };
  }, []);

  if (loadError) return <p className="text-[11px] text-amber-600">{loadError}</p>;
  if (!locations.length) return null;

  const rowFor = (locId) =>
    value.find(r => r.location === locId) || { location: locId, price: '', originalPrice: '', isAvailable: true };

  const update = (locId, field, fieldValue) => {
    const others = value.filter(r => r.location !== locId);
    const row = { ...rowFor(locId), [field]: fieldValue };
    const isEmpty = row.price === '' && row.originalPrice === '' && row.isAvailable !== false;
    onChange(isEmpty ? others : [...others, row]);
  };

  const setCount = value.filter(r => r.price !== '' || r.isAvailable === false).length;

  return (
    <div className="md:col-span-2 rounded-lg border border-blue-100 bg-blue-50/40">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-blue-800">
          <MapPin size={14} />
          Location prices
          <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] text-blue-700 border border-blue-200">
            {setCount ? `${setCount} of ${locations.length} set` : 'all use normal price'}
          </span>
        </span>
        {open ? <ChevronUp size={14} className="text-blue-700" /> : <ChevronDown size={14} className="text-blue-700" />}
      </button>

      {open && (
        <div className="px-3 pb-3">
          <p className="mb-2 text-[11px] text-gray-500">
            Leave the price empty to use the normal price{defaultPrice ? ` (₹${defaultPrice})` : ''}. Untick
            “Sold” to hide this pack in that location.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-xs">
              <thead>
                <tr className="text-left text-[11px] text-gray-500">
                  <th className="py-1 pr-2 font-medium">Location</th>
                  <th className="py-1 pr-2 font-medium">Price (₹)</th>
                  <th className="py-1 pr-2 font-medium">MRP (₹, optional)</th>
                  <th className="py-1 font-medium text-center">Sold</th>
                </tr>
              </thead>
              <tbody>
                {locations.map(loc => {
                  const row = rowFor(String(loc._id));
                  const hidden = row.isAvailable === false;
                  return (
                    <tr key={loc._id} className={hidden ? 'opacity-60' : ''}>
                      <td className="py-1 pr-2 text-gray-700">
                        {loc.name}
                        {!loc.isActive && <span className="ml-1 text-[10px] text-gray-400">(paused)</span>}
                      </td>
                      <td className="py-1 pr-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={row.price}
                          onChange={e => update(String(loc._id), 'price', cleanNumber(e.target.value))}
                          placeholder={defaultPrice ? String(defaultPrice) : 'normal'}
                          className="w-full rounded-md border border-gray-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={row.originalPrice}
                          onChange={e => update(String(loc._id), 'originalPrice', cleanNumber(e.target.value))}
                          placeholder="—"
                          className="w-full rounded-md border border-gray-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#ff0000]"
                        />
                      </td>
                      <td className="py-1 text-center">
                        <input
                          type="checkbox"
                          checked={!hidden}
                          onChange={e => update(String(loc._id), 'isAvailable', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-[#ff0000] focus:ring-[#ff0000]"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPriceEditor;
