import React, { useCallback, useEffect, useState } from 'react';
import { Star, Eye, EyeOff, Trash2, RefreshCw } from 'lucide-react';
import { FaSignOutAlt } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { reviewsAPI } from '../api/reviews';

const Stars = ({ value, size = 16 }) => (
  <span className="inline-flex" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        style={{ width: size, height: size }}
        className={i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
      />
    ))}
  </span>
);

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'published', label: 'Shown on website' },
  { key: 'hidden', label: 'Hidden' },
];

const Reviews = () => {
  const { logout } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reviewsAPI.list({ status, page });
      setReviews(res.data.data || []);
      setSummary(res.data.summary);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load reviews');
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (review) => {
    try {
      await reviewsAPI.setStatus(review._id, review.status === 'hidden' ? 'published' : 'hidden');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update review');
    }
  };

  const remove = async (id) => {
    try {
      await reviewsAPI.remove(id);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete review');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="w-full flex-1">
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold text-gray-800">Customer Reviews</h1>
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
          <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Stars value={summary?.average || 0} size={22} />
              <span className="text-lg font-semibold text-gray-800">
                {summary?.average?.toFixed(1) || '0.0'} / 5
              </span>
              <span className="text-sm text-gray-500">{summary?.count || 0} {summary?.count === 1 ? 'review' : 'reviews'} shown on website</span>
            </div>
            <p className="text-sm text-gray-500">
              Only customers with a delivered order can review. New reviews appear on the website straight away.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex rounded-lg border bg-white p-0.5">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => { setStatus(f.key); setPage(1); }}
                  className={`rounded-md px-3 py-1.5 text-sm ${status === f.key ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={load} className="rounded-lg border bg-white p-2 hover:bg-gray-50" aria-label="Refresh">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            {loading && reviews.length === 0 ? (
              <p className="p-8 text-center text-gray-500">Loading…</p>
            ) : reviews.length === 0 ? (
              <p className="p-8 text-center text-gray-500">No reviews yet.</p>
            ) : (
              <ul className="divide-y">
                {reviews.map(review => (
                  <li key={review._id} className={`p-4 ${review.status === 'hidden' ? 'bg-gray-50' : ''}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Stars value={review.rating} />
                          <span className="font-semibold text-gray-800">{review.productName}</span>
                          {review.status === 'hidden' && (
                            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">Hidden</span>
                          )}
                        </div>
                        {review.comment ? (
                          <p className="mt-1.5 text-gray-700">“{review.comment}”</p>
                        ) : (
                          <p className="mt-1.5 text-sm italic text-gray-400">No comment</p>
                        )}
                        <p className="mt-1.5 text-xs text-gray-500">
                          {review.customerName} · {review.user?.phoneNumber || 'unknown phone'} · Order #
                          {review.order?.orderId || '—'} · {new Date(review.createdAt).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => toggle(review)}
                          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {review.status === 'hidden' ? <Eye size={16} /> : <EyeOff size={16} />}
                          {review.status === 'hidden' ? 'Show' : 'Hide'}
                        </button>
                        {confirmDelete === review._id ? (
                          <button
                            onClick={() => remove(review._id)}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white"
                          >
                            Confirm delete
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(review._id)}
                            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border bg-white px-3 py-1.5 text-sm disabled:opacity-40">
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border bg-white px-3 py-1.5 text-sm disabled:opacity-40">
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Reviews;
