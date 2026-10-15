import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Settings2, RefreshCw, Lock, Bell, AlertTriangle, Clock } from 'lucide-react';
import { FaSignOutAlt } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { bookingAPI } from '../api/booking';
import DateEditorPanel from '../components/booking/DateEditorPanel';
import BookingRulesModal from '../components/booking/BookingRulesModal';
import {
  addDays, addMonths, getRange, formatDate, formatLong, formatTime, STATUS_STYLES, statusKey
} from '../components/booking/bookingUtils';

const VIEWS = ['month', 'week', 'day'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LEGEND = ['available', 'blocked', 'cutoff_passed', 'same_day', 'beyond_window'];

const DayCell = ({ day, today, anchorMonth, onSelect, large = false }) => {
  const style = STATUS_STYLES[statusKey(day)] || STATUS_STYLES.available;
  const outside = anchorMonth && day.date.slice(0, 7) !== anchorMonth;
  const override = day.override;

  return (
    <button
      onClick={() => onSelect(day)}
      className={`relative flex w-full flex-col items-start rounded-lg border p-2 text-left transition hover:shadow-md ${style.cell} ${outside ? 'opacity-50' : ''} ${large ? 'min-h-[160px]' : 'min-h-[84px] sm:min-h-[96px]'} ${day.date === today ? 'ring-2 ring-blue-400' : ''}`}
    >
      <div className="flex w-full items-center justify-between">
        <span className={`text-sm font-semibold ${style.text}`}>{Number(day.date.slice(8))}</span>
        <span className="flex items-center gap-1">
          {override?.isBlocked && <Lock size={12} className="text-red-600" />}
          {override?.showNotice && <Bell size={12} className="text-amber-500" />}
          {override?.cutoffTime && <Clock size={12} className="text-blue-600" />}
          {day.reviewCount > 0 && <AlertTriangle size={12} className="text-amber-600" />}
        </span>
      </div>
      <span className={`mt-1 hidden text-[11px] leading-tight sm:block ${style.text}`}>{style.label}</span>
      {day.orderCount > 0 && (
        <span className="mt-auto rounded-full bg-white/80 px-1.5 py-0.5 text-[11px] font-medium text-gray-700 shadow-sm">
          {day.orderCount} order{day.orderCount > 1 ? 's' : ''}
        </span>
      )}
      {large && override?.message && (
        <p className="mt-2 line-clamp-3 text-xs text-gray-600">{override.message}</p>
      )}
    </button>
  );
};

const BookingCalendar = () => {
  const { logout } = useAuth();
  const [view, setView] = useState('month');
  const [anchor, setAnchor] = useState(null);       // 'YYYY-MM-DD'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);

  const load = useCallback(async (nextView, nextAnchor) => {
    setLoading(true);
    setError('');
    try {
      // First load: ask the server for "today" (IST) and anchor on it
      const base = nextAnchor || (await bookingAPI.getCalendar()).data.data.today;
      const { from, to } = getRange(nextView, base);
      const [calendarRes, reviewRes] = await Promise.all([
        bookingAPI.getCalendar(from, to),
        bookingAPI.getReviewQueue()
      ]);
      setAnchor(base);
      setData(calendarRes.data.data);
      setReviewCount(reviewRes.data.count || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load the booking calendar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load('month', null);
  }, [load]);

  // Keep the open panel in sync with fresh calendar data
  const refresh = () => load(view, anchor);
  useEffect(() => {
    if (selected && data) {
      const fresh = data.dates.find(d => d.date === selected.date);
      if (fresh && fresh !== selected) setSelected(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const changeView = (next) => {
    setView(next);
    load(next, anchor);
  };

  const step = (direction) => {
    const next = view === 'month' ? addMonths(anchor, direction)
      : view === 'week' ? addDays(anchor, 7 * direction)
      : addDays(anchor, direction);
    load(view, next);
  };

  const goToday = () => data && load(view, data.today);

  const title = !anchor ? '' :
    view === 'month' ? formatDate(anchor, { month: 'long', year: 'numeric' }) :
    view === 'week' ? `${formatDate(data?.from || anchor, { day: 'numeric', month: 'short' })} – ${formatDate(data?.to || anchor, { day: 'numeric', month: 'short', year: 'numeric' })}` :
    formatLong(anchor);

  const config = data?.config;
  const days = data?.dates || [];
  const upcomingBlocked = days.filter(d => d.override?.isBlocked && d.date >= (data?.today || ''));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="w-full flex-1">
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold text-gray-800">Booking Calendar</h1>
            <button
              onClick={logout}
              className="flex items-center rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-white transition duration-200 hover:from-red-600 hover:to-red-700"
              title="Logout"
            >
              <span className="mr-2 hidden sm:inline">Logout</span>
              <FaSignOutAlt />
            </button>
          </div>
        </header>

        <main className="space-y-4 p-4 sm:p-6">
          {/* Rules summary */}
          {config && (
            <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                <span>
                  Status:{' '}
                  <strong className={config.bookingEnabled ? 'text-green-700' : 'text-red-700'}>
                    {config.bookingEnabled ? 'Accepting orders' : 'Bookings switched off'}
                  </strong>
                </span>
                <span>Cutoff: <strong>{formatTime(config.cutoffTime)}</strong> the day before delivery</span>
                <span>Window: <strong>{config.maxAdvanceDays} days</strong></span>
                <span>Time slots: <strong>{config.timeSlotsEnabled ? 'On' : 'Off'}</strong></span>
                <span>Server time: <strong>{data.serverTime} IST</strong></span>
              </div>
              <button
                onClick={() => setRulesOpen(true)}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings2 size={16} /> Booking rules
              </button>
            </div>
          )}

          {reviewCount > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              {reviewCount} paid order(s) have a delivery date that became unavailable. Dates with
              <AlertTriangle size={14} className="mx-1 inline" /> need review – open them to reschedule.
            </div>
          )}

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => step(-1)} className="rounded-lg border bg-white p-2 hover:bg-gray-50" aria-label="Previous"><ChevronLeft size={18} /></button>
              <button onClick={goToday} className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-50">Today</button>
              <button onClick={() => step(1)} className="rounded-lg border bg-white p-2 hover:bg-gray-50" aria-label="Next"><ChevronRight size={18} /></button>
              <h2 className="ml-2 text-lg font-semibold text-gray-800">{title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border bg-white p-0.5">
                {VIEWS.map(v => (
                  <button
                    key={v}
                    onClick={() => changeView(v)}
                    className={`rounded-md px-3 py-1.5 text-sm capitalize ${view === v ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <button onClick={refresh} className="rounded-lg border bg-white p-2 hover:bg-gray-50" aria-label="Refresh">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
            {LEGEND.map(key => (
              <span key={key} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLES[key].dot}`} /> {STATUS_STYLES[key].label}
              </span>
            ))}
            <span className="flex items-center gap-1"><Lock size={11} className="text-red-600" /> blocked</span>
            <span className="flex items-center gap-1"><Bell size={11} className="text-amber-500" /> notice</span>
            <span className="flex items-center gap-1"><Clock size={11} className="text-blue-600" /> custom cutoff</span>
          </div>

          {/* Grid */}
          <div className="rounded-xl bg-white p-2 shadow-sm sm:p-4">
            {loading && !data ? (
              <div className="py-20 text-center text-gray-500">Loading calendar…</div>
            ) : view === 'day' ? (
              days[0] && <DayCell day={days[0]} today={data.today} onSelect={setSelected} large />
            ) : (
              <>
                <div className="mb-1 grid grid-cols-7 gap-1 sm:gap-2">
                  {WEEKDAYS.map(d => (
                    <div key={d} className="py-1 text-center text-xs font-medium text-gray-500">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {days.map(day => (
                    <DayCell
                      key={day.date}
                      day={day}
                      today={data.today}
                      anchorMonth={view === 'month' ? anchor.slice(0, 7) : null}
                      onSelect={setSelected}
                      large={view === 'week'}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {upcomingBlocked.length > 0 && (
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <h3 className="mb-2 font-semibold text-gray-800">Blocked dates in this view</h3>
              <ul className="space-y-1 text-sm">
                {upcomingBlocked.map(d => (
                  <li key={d.date}>
                    <button onClick={() => setSelected(d)} className="text-left hover:underline">
                      <strong>{formatDate(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
                      {' – '}{data.reasons?.[d.override.reason] || 'Blocked'}
                      {d.orderCount > 0 && <span className="text-amber-700"> · {d.orderCount} existing order(s)</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
      </div>

      {selected && data && (
        <DateEditorPanel
          day={selected}
          today={data.today}
          config={config}
          reasons={data.reasons}
          onClose={() => setSelected(null)}
          onSaved={refresh}
        />
      )}

      {rulesOpen && config && (
        <BookingRulesModal config={config} onClose={() => setRulesOpen(false)} onSaved={refresh} />
      )}
    </div>
  );
};

export default BookingCalendar;
