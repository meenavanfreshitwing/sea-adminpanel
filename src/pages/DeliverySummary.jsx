import React, { useCallback, useEffect, useState } from 'react';
import { Printer, RefreshCw, Scale, ClipboardList, AlertTriangle } from 'lucide-react';
import { FaSignOutAlt } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { bookingAPI } from '../api/booking';

const addDays = (date, days) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const longDate = date =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });

const money = n => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const kg = n => `${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 3 })} kg`;

// "3.5 kg" plus pieces / litres / missing weights, so nothing is silently left out
const TotalCell = ({ p }) => (
  <div className="text-right">
    {p.totalKg > 0 && <div className="text-base font-bold text-gray-900">{kg(p.totalKg)}</div>}
    {p.totalLitres > 0 && <div className="font-semibold text-gray-900">{p.totalLitres} L</div>}
    {p.pieces > 0 && <div className="font-semibold text-gray-900">{p.pieces} pcs</div>}
    {p.noWeightQty > 0 && (
      <div className="mt-0.5 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
        <AlertTriangle size={12} /> {p.noWeightQty} pack{p.noWeightQty > 1 ? 's' : ''} without weight
      </div>
    )}
  </div>
);

const ProductTable = ({ products }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <th className="px-3 py-2">Fish</th>
          <th className="px-3 py-2">Packs ordered</th>
          <th className="px-3 py-2 text-center">Orders</th>
          <th className="px-3 py-2 text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        {products.map(p => (
          <tr key={p.productId} className="border-b last:border-0 align-top">
            <td className="px-3 py-2.5 font-semibold text-gray-900">{p.name}</td>
            <td className="px-3 py-2.5 text-gray-700">
              {p.packs.map(pk => (
                <span key={pk.label} className="mr-1.5 mb-1 inline-block whitespace-nowrap rounded bg-gray-100 px-2 py-0.5">
                  {pk.label} × {pk.qty}
                </span>
              ))}
            </td>
            <td className="px-3 py-2.5 text-center text-gray-700">{p.orderCount}</td>
            <td className="px-3 py-2.5"><TotalCell p={p} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const shortDate = date =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

// One cell: kg to buy for that fish on that date (pieces / missing weights shown too)
const PlanCell = ({ p, strong }) => {
  if (!p) return <span className="text-gray-300">–</span>;
  return (
    <div className="leading-tight">
      {p.totalKg > 0 && <div className={strong ? 'text-lg font-extrabold text-gray-900' : 'text-base font-bold text-gray-900'}>{kg(p.totalKg)}</div>}
      {p.pieces > 0 && <div className="font-bold text-gray-900">{p.pieces} pcs</div>}
      {p.totalLitres > 0 && <div className="font-bold text-gray-900">{p.totalLitres} L</div>}
      {p.noWeightQty > 0 && (
        <div className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] text-amber-700" title="Packs without a weight – set the weight in Products">
          <AlertTriangle size={11} /> +{p.noWeightQty} pack{p.noWeightQty > 1 ? 's' : ''} ?
        </div>
      )}
      <div className="text-[11px] text-gray-500">{p.orderCount} {p.orderCount === 1 ? 'order' : 'orders'}</div>
    </div>
  );
};

// Buying plan: rows = fish, columns = delivery dates, last column = total for the range
const PlanMatrix = ({ data }) => {
  const dates = data.dates;
  const cell = (day, productId) => day.products.find(p => p.productId === productId);
  return (
    <section className="rounded-xl bg-white shadow-sm print:break-after-page print:shadow-none">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold text-gray-900">Buying plan – kg of each fish per delivery date</h2>
        <p className="text-xs text-gray-500">Pre-orders: buy these amounts for each delivery day.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="sticky left-0 bg-gray-50 px-3 py-2">Fish</th>
              {dates.map(d => (
                <th key={d.date} className="whitespace-nowrap px-3 py-2 text-right">
                  {d.date === 'no-date' ? 'No date' : shortDate(d.date)}
                  {d.date === data.today && <span className="ml-1 rounded bg-blue-100 px-1 text-[10px] text-blue-700">Today</span>}
                </th>
              ))}
              {dates.length > 1 && <th className="whitespace-nowrap bg-green-50 px-3 py-2 text-right text-green-800">Total</th>}
            </tr>
          </thead>
          <tbody>
            {data.overall.products.map(p => (
              <tr key={p.productId} className="border-b align-top last:border-0">
                <td className="sticky left-0 bg-white px-3 py-2.5 font-semibold text-gray-900">{p.name}</td>
                {dates.map(d => (
                  <td key={d.date} className="px-3 py-2.5 text-right"><PlanCell p={cell(d, p.productId)} /></td>
                ))}
                {dates.length > 1 && <td className="bg-green-50 px-3 py-2.5 text-right"><PlanCell p={p} strong /></td>}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 bg-gray-50 font-bold text-gray-900">
              <td className="sticky left-0 bg-gray-50 px-3 py-2.5">All fish</td>
              {dates.map(d => (
                <td key={d.date} className="px-3 py-2.5 text-right">
                  <div>{kg(d.totalKg)}</div>
                  <div className="text-[11px] font-normal text-gray-500">{d.orderCount} {d.orderCount === 1 ? 'order' : 'orders'}</div>
                </td>
              ))}
              {dates.length > 1 && (
                <td className="bg-green-100 px-3 py-2.5 text-right text-green-900">
                  <div className="text-lg">{kg(data.overall.totalKg)}</div>
                  <div className="text-[11px] font-normal">{data.overall.orderCount} orders</div>
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
};

const DeliverySummary = () => {
  const { logout } = useAuth();
  const [range, setRange] = useState({ from: '', to: '' });
  const [pendingOnly, setPendingOnly] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bookingAPI.getDeliverySummary(range.from || undefined, range.to || undefined, pendingOnly);
      const d = res.data.data;
      setData(d);
      if (!range.from) setRange({ from: d.from, to: d.to });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load the delivery summary.');
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to, pendingOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const today = data?.today;
  const quick = today
    ? [
        { label: 'Today', from: today, to: today },
        { label: 'Tomorrow', from: addDays(today, 1), to: addDays(today, 1) },
        { label: 'Next 7 days', from: today, to: addDays(today, 6) },
        { label: 'Last 7 days', from: addDays(today, -6), to: today },
      ]
    : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="w-full flex-1">
        <header className="bg-white shadow print:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold text-gray-800">Delivery Summary</h1>
            <button
              onClick={logout}
              className="flex items-center rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-white hover:from-red-600 hover:to-red-700"
            >
              <span className="mr-2 hidden sm:inline">Logout</span>
              <FaSignOutAlt />
            </button>
          </div>
        </header>

        <main className="space-y-4 p-4 sm:p-6 print:p-0">
          {/* Controls */}
          <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm print:hidden">
            <p className="text-sm text-gray-500">
              How much of each fish to buy, pack and deliver, by delivery date. Cancelled orders and unpaid
              online orders are not counted.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              {quick.map(q => {
                const active = range.from === q.from && range.to === q.to;
                return (
                  <button
                    key={q.label}
                    onClick={() => setRange({ from: q.from, to: q.to })}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${active ? 'border-red-600 bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    {q.label}
                  </button>
                );
              })}
              <label className="ml-1 text-xs text-gray-500">
                From
                <input
                  type="date"
                  value={range.from}
                  onChange={e => setRange(r => ({ ...r, from: e.target.value, to: r.to < e.target.value ? e.target.value : r.to }))}
                  className="mt-0.5 block rounded-lg border px-2 py-1 text-sm text-gray-800"
                />
              </label>
              <label className="text-xs text-gray-500">
                To
                <input
                  type="date"
                  value={range.to}
                  min={range.from}
                  onChange={e => setRange(r => ({ ...r, to: e.target.value }))}
                  className="mt-0.5 block rounded-lg border px-2 py-1 text-sm text-gray-800"
                />
              </label>
              <div className="flex rounded-lg border bg-white p-0.5">
                <button
                  onClick={() => setPendingOnly(false)}
                  className={`rounded-md px-3 py-1.5 text-sm ${!pendingOnly ? 'bg-gray-800 text-white' : 'text-gray-600'}`}
                >
                  All orders
                </button>
                <button
                  onClick={() => setPendingOnly(true)}
                  className={`rounded-md px-3 py-1.5 text-sm ${pendingOnly ? 'bg-gray-800 text-white' : 'text-gray-600'}`}
                >
                  Still to deliver
                </button>
              </div>
              <button onClick={load} className="rounded-lg border bg-white p-2 text-gray-600 hover:bg-gray-50" title="Refresh">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => window.print()}
                disabled={!data?.dates?.length}
                className="ml-auto flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-40"
              >
                <Printer size={16} /> Print
              </button>
            </div>
          </div>

          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {data && (
            <>
              {/* Title used on the printed sheet */}
              <div className="hidden print:block">
                <h1 className="text-xl font-bold">Meenavan Fresh – Delivery summary</h1>
                <p className="text-sm">
                  {longDate(data.from)}{data.to !== data.from ? ` to ${longDate(data.to)}` : ''}
                  {data.pendingOnly ? ' · still to deliver' : ''}
                </p>
              </div>

              {/* Range totals */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                  <ClipboardList className="text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{data.overall.orderCount}</div>
                    <div className="text-sm text-gray-500">{data.overall.orderCount === 1 ? 'order' : 'orders'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                  <Scale className="text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{kg(data.overall.totalKg)}</div>
                    <div className="text-sm text-gray-500">fish in total</div>
                  </div>
                </div>
              </div>

              {data.dates.length === 0 ? (
                <div className="rounded-xl bg-white p-8 text-center text-gray-500 shadow-sm">
                  No orders for these dates.
                </div>
              ) : (
                <>
                  <PlanMatrix data={data} />

                  {data.overall.products.some(p => p.noWeightQty > 0) && (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 print:hidden">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                      <span>
                        Some packs have no weight, so they are not in the kg total (shown as “+ packs ?”).
                        Open <b>Products</b>, edit the fish and set a weight on every pack (e.g. 500 gram, 1 kg).
                      </span>
                    </div>
                  )}

                  <h2 className="pt-2 text-sm font-semibold uppercase tracking-wide text-gray-500 print:hidden">Details per delivery date</h2>

                  {data.dates.map(day => (
                    <section key={day.date} className="rounded-xl bg-white shadow-sm print:break-inside-avoid print:shadow-none">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b px-4 py-3">
                        <h2 className="font-semibold text-gray-900">
                          {day.date === 'no-date' ? 'No delivery date' : longDate(day.date)}
                          {day.date === today && <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">Today</span>}
                        </h2>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                          <span><b className="text-gray-900">{day.orderCount}</b> {day.orderCount === 1 ? 'order' : 'orders'}</span>
                          <span><b className="text-gray-900">{kg(day.totalKg)}</b></span>
                          {day.deliveredCount > 0 && <span>{day.deliveredCount} delivered</span>}
                          <span>Cash to collect <b className="text-gray-900">{money(day.cashToCollect)}</b></span>
                          <span>Paid online <b className="text-gray-900">{money(day.paidOnline)}</b></span>
                        </div>
                      </div>
                      <ProductTable products={day.products} />
                    </section>
                  ))}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default DeliverySummary;
