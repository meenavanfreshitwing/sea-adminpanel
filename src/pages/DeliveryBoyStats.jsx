// src/pages/DeliveryBoyStats.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { deliveryBoyAPI } from '../api/deliveryBoy';
import {
  FaTruck, FaArrowLeft, FaBox, FaCheckCircle, FaTimesCircle,
  FaClock, FaRupeeSign, FaCalendarAlt, FaMapMarkerAlt, FaPhone,
  FaEnvelope, FaCar, FaList, FaHashtag
} from 'react-icons/fa';

const DeliveryBoyStats = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [deliveryBoy, setDeliveryBoy] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [ordersPagination, setOrdersPagination] = useState({ currentPage: 1, totalPages: 1, totalOrders: 0 });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
    }
    fetchStats();
    fetchAllOrders();
  }, [id]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await deliveryBoyAPI.getDeliveryBoyStats(id);
      setStats(response.data.stats);
      setDeliveryBoy(response.data.deliveryBoy);
      setMonthlyStats(response.data.monthlyStats || []);
      setRecentOrders(response.data.recentOrders || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllOrders = async (page = 1, status = 'all') => {
    try {
      setOrdersLoading(true);
      const response = await deliveryBoyAPI.getDeliveryBoyOrders(id, {
        status: status,
        page,
        limit: 50
      });
      setAllOrders(response.data.orders || []);
      setOrdersPagination({
        currentPage: response.data.pagination?.currentPage || 1,
        totalPages: response.data.pagination?.totalPages || 1,
        totalOrders: response.data.pagination?.totalOrders || 0
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleFilterChange = (status) => {
    setOrderStatusFilter(status);
    fetchAllOrders(1, status);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: '2-digit',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status, orderStatus) => {
    if (orderStatus === 'cancelled') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelled</span>;
    }
    if (status === 'delivered') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Delivered</span>;
    }
    if (status === 'picked_up') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Picked Up</span>;
    }
    if (status === 'assigned') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Assigned</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
  };

  // ✅ Show ward if present, else show city + street (for non-Karaikudi orders)
  const getLocationDisplay = (order) => {
    if (order.wardId) {
      return order.wardName ? `Ward ${order.wardId} - ${order.wardName}` : `Ward ${order.wardId}`;
    }
    if (order.shippingAddress) {
      const parts = [
        order.shippingAddress.street,
        order.shippingAddress.city,
        order.shippingAddress.postalCode
      ].filter(Boolean);
      return parts.join(', ') || '—';
    }
    return '—';
  };

  // ✅ Resolve customer name
  const getCustomerName = (order) =>
    order.name ||
    order.shippingAddress?.name ||
    order.customer?.name ||
    order.user?.name ||
    'Customer';

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff0000] mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 w-full min-w-0">
        <header className="bg-white shadow sticky top-0 z-10">
          <div className="flex items-center justify-between px-3 sm:px-4 py-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => navigate('/delivery-boys')}
                className="text-gray-600 hover:text-[#ff0000] transition flex-shrink-0"
              >
                <FaArrowLeft size={18} className="sm:w-5 sm:h-5" />
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <FaTruck className="text-[#ff0000] flex-shrink-0" size={20} />
                <h1 className="text-base sm:text-xl font-bold text-gray-800 truncate">Delivery Boy Statistics</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="p-3 sm:p-6">
          {/* Delivery Boy Info Card */}
          <div className="bg-gradient-to-r from-[#ff0000] to-[#cc0000] rounded-lg p-3 sm:p-5 text-white mb-4 sm:mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
              <div className="w-full min-w-0">
<div className="flex items-center gap-2 flex-wrap">
  <h2 className="text-lg sm:text-2xl font-bold truncate">{deliveryBoy?.name}</h2>
  {deliveryBoy?.city && (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold uppercase bg-white/25 text-white border border-white/30">
       {deliveryBoy.city.slice(0, 20)}
    </span>
  )}
</div>                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1.5 sm:gap-4 mt-2 text-xs sm:text-sm text-white/90">
                  <span className="flex items-center gap-1">
                    <FaPhone size={11} className="sm:w-3 sm:h-3 flex-shrink-0" />
                    <span className="truncate">{deliveryBoy?.phone}</span>
                  </span>
                  <span className="flex items-center gap-1 min-w-0">
                    <FaEnvelope size={11} className="sm:w-3 sm:h-3 flex-shrink-0" />
                    <span className="truncate">{deliveryBoy?.email}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <FaCar size={11} className="sm:w-3 sm:h-3 flex-shrink-0" />
                    {deliveryBoy?.vehicleType} {deliveryBoy?.vehicleNumber && `(${deliveryBoy.vehicleNumber})`}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaCalendarAlt size={11} className="sm:w-3 sm:h-3 flex-shrink-0" />
                    Joined: {formatDate(deliveryBoy?.joinedAt)}
                  </span>
                </div>

                {/* ✅ Areas (free-text) */}
                {deliveryBoy?.areas?.length > 0 && (
                  <div className="mt-2 sm:mt-3">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="text-white/80 text-[11px] sm:text-sm">Assigned Cities:</span>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {deliveryBoy.areas.map((area, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-white/20 text-white">
                            <FaMapMarkerAlt size={9} className="sm:w-2.5 sm:h-2.5" />
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Wards */}
                {deliveryBoy?.wardIds?.length > 0 && (
                  <div className="mt-2 sm:mt-3">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="text-white/80 text-[11px] sm:text-sm">Assigned Wards:</span>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {deliveryBoy.wardIds.map((wardId, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-white/20 text-white">
                            <FaHashtag size={9} className="sm:w-2.5 sm:h-2.5" />
                            Ward {wardId}
                          </span>
                        ))}
                      </div>
                    </div>
                    {deliveryBoy?.wardNames?.length > 0 && (
                      <div className="mt-1.5 sm:mt-2">
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {deliveryBoy.wardNames.map((wardName, index) => (
                            <span key={index} className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-white/20 text-white break-words">
                              <FaMapMarkerAlt size={9} className="sm:w-2.5 sm:h-2.5 flex-shrink-0" />
                              <span className="truncate max-w-[180px] sm:max-w-none">{wardName}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!deliveryBoy?.areas?.length && !deliveryBoy?.wardIds?.length && (
                  <div className="mt-2 sm:mt-3 text-white/60 text-xs sm:text-sm">No areas or wards assigned</div>
                )}

                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-white/20 text-white">
                    Status: {deliveryBoy?.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                  </span>
                </div>
              </div>
              <div className="bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex-shrink-0">
                <p className="text-xs sm:text-sm">Total Deliveries: <span className="font-bold text-base sm:text-xl">{deliveryBoy?.totalDeliveries || 0}</span></p>
              </div>
            </div>
          </div>

          {/* Stats Cards — 4 in one row on mobile */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white rounded-lg p-1.5 sm:p-4 shadow-sm border border-gray-200">
              <div className="flex flex-col items-center text-center sm:flex-row sm:justify-between sm:items-center sm:text-left">
                <div className="min-w-0 w-full sm:w-auto">
                  <p className="text-[9px] sm:text-sm text-gray-500 font-medium leading-tight truncate">
                    Orders
                  </p>
                  <p className="text-base sm:text-2xl font-bold text-gray-800 mt-0.5">
                    {stats?.totalOrders || 0}
                  </p>
                </div>
                <div className="hidden sm:flex bg-blue-100 p-2 rounded-full flex-shrink-0">
                  <FaBox className="text-blue-600" size={16} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-1.5 sm:p-4 shadow-sm border border-gray-200">
              <div className="flex flex-col items-center text-center sm:flex-row sm:justify-between sm:items-center sm:text-left">
                <div className="min-w-0 w-full sm:w-auto">
                  <p className="text-[9px] sm:text-sm text-gray-500 font-medium leading-tight truncate">
                    Delivered
                  </p>
                  <p className="text-base sm:text-2xl font-bold text-green-600 mt-0.5">
                    {stats?.deliveredOrders || 0}
                  </p>
                </div>
                <div className="hidden sm:flex bg-green-100 p-2 rounded-full flex-shrink-0">
                  <FaCheckCircle className="text-green-600" size={16} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-1.5 sm:p-4 shadow-sm border border-gray-200">
              <div className="flex flex-col items-center text-center sm:flex-row sm:justify-between sm:items-center sm:text-left">
                <div className="min-w-0 w-full sm:w-auto">
                  <p className="text-[9px] sm:text-sm text-gray-500 font-medium leading-tight truncate">
                    Cancelled
                  </p>
                  <p className="text-base sm:text-2xl font-bold text-red-600 mt-0.5">
                    {stats?.cancelledOrders || 0}
                  </p>
                </div>
                <div className="hidden sm:flex bg-red-100 p-2 rounded-full flex-shrink-0">
                  <FaTimesCircle className="text-red-600" size={16} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-1.5 sm:p-4 shadow-sm border border-gray-200">
              <div className="flex flex-col items-center text-center sm:flex-row sm:justify-between sm:items-center sm:text-left">
                <div className="min-w-0 w-full sm:w-auto">
                  <p className="text-[9px] sm:text-sm text-gray-500 font-medium leading-tight truncate">
                    Pending
                  </p>
                  <p className="text-base sm:text-2xl font-bold text-yellow-600 mt-0.5">
                    {stats?.pendingOrders || 0}
                  </p>
                </div>
                <div className="hidden sm:flex bg-yellow-100 p-2 rounded-full flex-shrink-0">
                  <FaClock className="text-yellow-600" size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* All Orders Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FaList className="text-[#ff0000]" size={14} />
                All Orders ({ordersPagination.totalOrders})
              </h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="flex-1 sm:flex-none px-3 py-1.5 sm:py-1 border border-gray-300 rounded-lg text-xs sm:text-sm bg-white"
                >
                  <option value="all">All Orders</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            {ordersLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff0000]"></div>
              </div>
            ) : (
              <>
                {/* Desktop Table (md and up) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Order ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Payment</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allOrders.map((order, index) => (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                          <td className="px-4 py-3 text-sm font-mono break-all">{order.orderId}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium text-gray-900">{getCustomerName(order)}</div>
                            {order.shippingAddress?.phone && (
                              <div className="text-xs text-gray-500">{order.shippingAddress.phone}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">{formatDate(order.createdAt)}</td>
                          <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(order.finalAmount)}</td>
                          <td className="px-4 py-3">{getStatusBadge(order.deliveryStatus, order.orderStatus)}</td>
                          <td className="px-4 py-3 text-sm capitalize">{order.paymentMethod}</td>
                          <td className="px-4 py-3 text-sm max-w-xs truncate" title={getLocationDisplay(order)}>
                            {getLocationDisplay(order)}
                          </td>
                        </tr>
                      ))}
                      {allOrders.length === 0 && (
                        <tr>
                          <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                            No orders found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                  <div className="divide-y divide-gray-200">
                    {allOrders.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 text-sm">No orders found</div>
                    ) : (
                      allOrders.map((order, index) => (
                        <div key={order._id} className="p-3">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[11px] text-gray-500 flex-shrink-0">#{index + 1}</span>
                                <p className="text-[11px] font-mono text-gray-500 truncate" title={order.orderId}>
                                  {order.orderId}
                                </p>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                👤 {getCustomerName(order)}
                              </p>
                              {order.shippingAddress?.phone && (
                                <p className="text-[11px] text-gray-500 truncate">📞 {order.shippingAddress.phone}</p>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              {getStatusBadge(order.deliveryStatus, order.orderStatus)}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] mb-2">
                            <div>
                              <p className="text-gray-500">Date</p>
                              <p className="font-medium text-gray-800">{formatShortDate(order.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-500">Amount</p>
                              <p className="font-bold text-gray-900">{formatCurrency(order.finalAmount)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Payment</p>
                              <p className="font-medium text-gray-800 capitalize">{order.paymentMethod}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-500">Location</p>
                              <p className="font-medium text-gray-800 truncate" title={getLocationDisplay(order)}>
                                {getLocationDisplay(order)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {ordersPagination.totalPages > 1 && (
                  <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-gray-200 flex justify-between items-center gap-2">
                    <button
                      onClick={() => fetchAllOrders(ordersPagination.currentPage - 1, orderStatusFilter)}
                      disabled={ordersPagination.currentPage === 1}
                      className="px-2.5 sm:px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 text-xs sm:text-sm"
                    >
                      Prev
                    </button>
                    <span className="text-[11px] sm:text-sm">
                      Page {ordersPagination.currentPage} / {ordersPagination.totalPages}
                    </span>
                    <button
                      onClick={() => fetchAllOrders(ordersPagination.currentPage + 1, orderStatusFilter)}
                      disabled={ordersPagination.currentPage === ordersPagination.totalPages}
                      className="px-2.5 sm:px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 text-xs sm:text-sm"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DeliveryBoyStats;