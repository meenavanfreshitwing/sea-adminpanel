// Date strings are 'YYYY-MM-DD' calendar days (India time, decided by the server).
// All math is done in UTC so the browser's timezone never shifts a day.

export const addDays = (date, days) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const weekday = (date) => new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday

export const startOfWeek = (date) => addDays(date, -weekday(date));

export const startOfMonth = (date) => `${date.slice(0, 7)}-01`;

export const addMonths = (date, months) => {
  const d = new Date(`${startOfMonth(date)}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
};

export const formatDate = (date, options) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', { timeZone: 'UTC', ...options });

export const formatLong = (date) =>
  formatDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// '17:00' -> '5:00 PM'
export const formatTime = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

// Visible range for each calendar view
export const getRange = (view, anchor) => {
  if (view === 'day') return { from: anchor, to: anchor };
  if (view === 'week') {
    const from = startOfWeek(anchor);
    return { from, to: addDays(from, 6) };
  }
  const from = startOfWeek(startOfMonth(anchor));
  return { from, to: addDays(from, 41) }; // 6-week grid
};

export const REASON_PRESETS = {
  cyclone: {
    title: 'Cyclone alert – no delivery',
    message: 'Due to cyclone conditions, fishing activities are temporarily suspended. Fresh fish may not be available for delivery on this date. Please select another available date. We apologize for the inconvenience.'
  },
  bad_weather: {
    title: 'Bad weather – no delivery',
    message: 'Due to bad weather, fishing boats could not go out to sea. Fresh fish may not be available for delivery on this date. Please select another available date. We apologize for the inconvenience.'
  },
  rough_sea: {
    title: 'Rough sea – no delivery',
    message: 'Due to rough sea conditions, fishing boats are unable to go out. Fresh fish may not be available for delivery on this date. Please select another available date.'
  },
  boats_unavailable: {
    title: 'No fresh catch on this date',
    message: 'Fishing boats are unable to go out to sea, so fresh fish will not be available for delivery on this date. Please select another available date.'
  },
  holiday: {
    title: 'Holiday – no delivery',
    message: 'We are closed for a holiday on this date. Please select another delivery date.'
  },
  stock_unavailable: {
    title: 'Fresh stock unavailable',
    message: 'Fresh stock is not available for delivery on this date. Please select another available date.'
  },
  other: {
    title: 'Delivery not available',
    message: 'Delivery is not available on this date. Please select another available date.'
  }
};

// How a date looks in the admin grid
export const STATUS_STYLES = {
  available: { label: 'Open', cell: 'bg-green-50 border-green-200', dot: 'bg-green-500', text: 'text-green-700' },
  blocked: { label: 'Blocked', cell: 'bg-red-50 border-red-300', dot: 'bg-red-500', text: 'text-red-700' },
  no_slots: { label: 'All slots blocked', cell: 'bg-red-50 border-red-300', dot: 'bg-red-500', text: 'text-red-700' },
  cutoff_passed: { label: 'Cutoff passed', cell: 'bg-gray-100 border-gray-200', dot: 'bg-gray-400', text: 'text-gray-500' },
  same_day: { label: 'Today (no same-day)', cell: 'bg-gray-100 border-gray-200', dot: 'bg-gray-400', text: 'text-gray-500' },
  past: { label: 'Past', cell: 'bg-gray-50 border-gray-100', dot: 'bg-gray-300', text: 'text-gray-400' },
  beyond_window: { label: 'Beyond booking window', cell: 'bg-white border-gray-200 border-dashed', dot: 'bg-gray-300', text: 'text-gray-400' },
  booking_closed: { label: 'Bookings switched off', cell: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', text: 'text-amber-700' }
};

export const statusKey = (day) => (day.available ? 'available' : day.reason);
