// src/pages/OrdersPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { ordersAPI } from '../api/orders';
import { deliveryBoyAPI } from '../api/deliveryBoy';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Search } from 'lucide-react';
import { FaSyncAlt, FaTag, FaTruck, FaMapMarkerAlt, FaPhone, FaUser, FaBox, FaCheck, FaSquare } from 'react-icons/fa';

const OrdersPage = () => {
  const { logout, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundStatus, setRefundStatus] = useState({});
  const [activeRefundOrderId, setActiveRefundOrderId] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState({});
  const [assigningOrderId, setAssigningOrderId] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, orderId: null, orderNumber: null });

  const [downloadingToday, setDownloadingToday] = useState(false);

  const [assignModalOrder, setAssignModalOrder] = useState(null);
  const [assignSearchTerm, setAssignSearchTerm] = useState('');

  const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());
  const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState(false);
  const [bulkAssignSearchTerm, setBulkAssignSearchTerm] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);

  // ✅ NEW — Bulk delete state
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [viewMode, setViewMode] = useState('grid');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const [sortOption, setSortOption] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const statusOptions = [
    { value: 'all', label: 'All Status', icon: '📋' },
    { value: 'pending', label: 'Pending', icon: '⏳' },
    { value: 'confirmed', label: 'Confirmed', icon: '✅' },
    { value: 'processing', label: 'Processing', icon: '⚙️' },
    { value: 'shipped', label: 'Shipped', icon: '🚚' },
    { value: 'delivered', label: 'Delivered', icon: '📦' },
    { value: 'cancelled', label: 'Cancelled', icon: '❌' }
  ];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (user) setUserRole(user.role || 'admin');
  }, [user]);

  useEffect(() => {
    fetchOrders();
    fetchDeliveryBoys();
  }, []);

  const fetchDeliveryBoys = async () => {
    try {
      const response = await deliveryBoyAPI.getAllDeliveryBoys();
      let list = [];
      if (response.data?.deliveryBoys && Array.isArray(response.data.deliveryBoys)) list = response.data.deliveryBoys;
      else if (Array.isArray(response.data)) list = response.data;
      setDeliveryBoys(list.filter(b => b.status === 'active' && (b._id || b.id)));
    } catch (err) {
      console.error('Error fetching delivery boys:', err);
    }
  };

  useEffect(() => {
    if (!orders.length) { setFilteredOrders([]); return; }

    let result = [...orders];
    if (selectedStatus !== 'all') result = result.filter(o => o.orderStatus === selectedStatus);

    if (searchTerm.trim() !== '') {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(order => {
        const customer = getCustomerInfo(order);
        const cityText = (order.shippingAddress?.city || '').toLowerCase();
        const areaText = (order.typedArea || '').toLowerCase();
        const wardText = (order.wardName || '').toLowerCase();
        return (
          (order.orderId && order.orderId.toLowerCase().includes(term)) ||
          (customer.name && customer.name.toLowerCase().includes(term)) ||
          (customer.email && customer.email.toLowerCase().includes(term)) ||
          (customer.phone && customer.phone.toLowerCase().includes(term)) ||
          (customer.alternatePhone && customer.alternatePhone.toLowerCase().includes(term)) ||
          cityText.includes(term) ||
          areaText.includes(term) ||
          wardText.includes(term)
        );
      });
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case 'newest': return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'oldest': return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'amount-high': return (b.finalAmount || 0) - (a.finalAmount || 0);
        case 'amount-low': return (a.finalAmount || 0) - (b.finalAmount || 0);
        default: return 0;
      }
    });

    setFilteredOrders(result);
  }, [orders, sortOption, selectedStatus, searchTerm]);

  const fetchOrders = async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) setRefreshing(true);
      else setLoading(true);
      setError('');

      const response = await ordersAPI.getOrders();
      let ordersData = [];
      if (Array.isArray(response.data)) ordersData = response.data;
      else if (response.data && Array.isArray(response.data.orders)) ordersData = response.data.orders;
      else if (response.data && Array.isArray(response.data.data)) ordersData = response.data.data;
      else if (Array.isArray(response)) ordersData = response;

      setOrders(ordersData || []);
    } catch (err) {
      setError('Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchOrders(true);
    fetchDeliveryBoys();
    setSelectedOrderIds(prev => {
      const next = new Set();
      orders.forEach(o => { if (prev.has(o._id)) next.add(o._id); });
      return next;
    });
  };

  const handleDownloadTodayOrders = async () => {
    try {
      setDownloadingToday(true);
      const response = await ordersAPI.downloadTodayOrdersPDF();

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().slice(0, 10);
      link.download = `today-orders-${today}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Download failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setDownloadingToday(false);
    }
  };

  const getAssignedBoy = (order) => {
    if (!order?.deliveryBoy) return null;
    if (typeof order.deliveryBoy === 'object' && order.deliveryBoy._id) return order.deliveryBoy;
    const id = typeof order.deliveryBoy === 'string' ? order.deliveryBoy : order.deliveryBoy?.toString?.();
    return deliveryBoys.find(b => (b._id || b.id) === id) || null;
  };

  const getBoyLocation = (boy) => {
    if (!boy) return '—';
    const parts = [];
    if (boy.city) parts.push(boy.city.toUpperCase());
    if (Array.isArray(boy.wardIds) && boy.wardIds.length) parts.push(`Wards ${boy.wardIds.join(',')}`);
    if (Array.isArray(boy.areas) && boy.areas.length) parts.push(boy.areas.join(', '));
    return parts.join(' • ') || '—';
  };

  const getBoySearchText = (boy) => {
    if (!boy) return '';
    const parts = [
      boy.name, boy.phone, boy.email, boy.city,
      ...(Array.isArray(boy.wardIds) ? boy.wardIds.map(String) : []),
      ...(Array.isArray(boy.wardNames) ? boy.wardNames : []),
      ...(Array.isArray(boy.areas) ? boy.areas : [])
    ].filter(Boolean);
    return parts.join(' ').toLowerCase();
  };

  const handleAssignDeliveryBoy = async (orderId, deliveryBoyId) => {
    try {
      setAssigningOrderId(orderId);
      const response = await ordersAPI.assignDeliveryBoy(orderId, deliveryBoyId);
      if (response.data?.success) {
        setOrders(prev => prev.map(o =>
          o._id === orderId
            ? { ...o,
                deliveryBoy: response.data.order?.deliveryBoy || (deliveryBoyId ? { _id: deliveryBoyId } : null),
                deliveryStatus: response.data.order?.deliveryStatus || (deliveryBoyId ? 'assigned' : 'unassigned') }
            : o
        ));
        setTimeout(() => fetchOrders(), 800);
      } else {
        alert(`❌ ${response.data?.message || 'Failed to assign'}`);
      }
    } catch (err) {
      alert(`❌ ${err.response?.data?.message || err.message}`);
    } finally {
      setAssigningOrderId(null);
    }
  };

  const toggleOrderSelect = (orderId) => {
    setSelectedOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedOrderIds(new Set());
  };

  const handleBulkAssign = async (deliveryBoyId) => {
    if (!deliveryBoyId) { alert('Select a delivery boy'); return; }
    const ids = Array.from(selectedOrderIds);
    if (ids.length === 0) { alert('No orders selected'); return; }

    setBulkAssigning(true);
    let ok = 0, fail = 0;

    for (const orderId of ids) {
      try {
        const res = await ordersAPI.assignDeliveryBoy(orderId, deliveryBoyId);
        if (res.data?.success) ok++;
        else fail++;
      } catch {
        fail++;
      }
    }

    setBulkAssigning(false);
    setBulkAssignModalOpen(false);
    setBulkAssignSearchTerm('');
    clearSelection();
    await fetchOrders(true);

    alert(`✅ Assigned ${ok} order${ok !== 1 ? 's' : ''}${fail > 0 ? ` • ❌ Failed ${fail}` : ''}`);
  };

  // ✅ NEW — Bulk delete handler
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedOrderIds);
    if (ids.length === 0) {
      alert('No orders selected');
      return;
    }

    setBulkDeleting(true);
    let ok = 0;
    let fail = 0;

    for (const orderId of ids) {
      try {
        const res = await ordersAPI.deleteOrder(orderId);
        if (res.data?.success) ok++;
        else fail++;
      } catch (err) {
        console.error('Delete failed for', orderId, err);
        fail++;
      }
    }

    setBulkDeleting(false);
    setBulkDeleteModalOpen(false);

    // Optimistic removal
    setOrders(prev => prev.filter(o => !selectedOrderIds.has(o._id)));
    clearSelection();

    await fetchOrders(true);

    if (ok > 0) {
      setError(`✅ Deleted ${ok} order${ok !== 1 ? 's' : ''}${fail > 0 ? ` • ❌ Failed ${fail}` : ''}`);
    } else {
      setError('❌ Failed to delete orders');
    }
    setTimeout(() => setError(''), 4000);
  };

  const openAssignModal = (order) => {
    setAssignModalOrder(order);
    setAssignSearchTerm('');
  };

  const closeAssignModal = () => {
    setAssignModalOrder(null);
    setAssignSearchTerm('');
  };

  const filteredBoysForAssign = useMemo(() => {
    if (!assignSearchTerm.trim()) return deliveryBoys;
    const term = assignSearchTerm.trim().toLowerCase();
    return deliveryBoys.filter(b => getBoySearchText(b).includes(term));
  }, [assignSearchTerm, deliveryBoys]);

  const filteredBoysForBulkAssign = useMemo(() => {
    if (!bulkAssignSearchTerm.trim()) return deliveryBoys;
    const term = bulkAssignSearchTerm.trim().toLowerCase();
    return deliveryBoys.filter(b => getBoySearchText(b).includes(term));
  }, [bulkAssignSearchTerm, deliveryBoys]);

  const handleDeleteOrder = async (orderId, orderNumber) => {
    if (!orderId) return;
    try {
      setLoading(true);
      const response = await ordersAPI.deleteOrder(orderId);
      if (response.data.success) {
        setOrders(prev => prev.filter(order => order._id !== orderId));
        setDeleteModal({ show: false, orderId: null, orderNumber: null });
        setError('✅ Order deleted successfully');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      setError('❌ Failed to delete order');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (newStatus === 'cancelled' && !window.confirm('⚠️ Cancel this order?')) return;
    if (newStatus === 'delivered' && !window.confirm('✅ Mark this order as delivered?')) return;
    try {
      setStatusUpdating(prev => ({ ...prev, [orderId]: true }));
      const response = await ordersAPI.updateOrderStatus(orderId, {
        orderStatus: newStatus,
        ...(newStatus === 'cancelled' && { cancellationReason: 'Cancelled by admin via dashboard' })
      });
      if (response.data.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? {
          ...o, orderStatus: newStatus,
          deliveryStatus: response.data.order?.deliveryStatus || o.deliveryStatus,
          paymentStatus: response.data.order?.paymentStatus || o.paymentStatus,
          deliveryBoy: newStatus === 'cancelled' ? null : o.deliveryBoy
        } : o));
        setTimeout(() => fetchOrders(), 1000);
      }
    } catch (error) {
      alert(`❌ ${error.response?.data?.message || error.message}`);
    } finally {
      setStatusUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handlePaymentStatusUpdate = async (orderId, newPaymentStatus) => {
    try {
      setStatusUpdating(prev => ({ ...prev, [orderId]: true }));
      const response = await ordersAPI.updateOrderStatus(orderId, { paymentStatus: newPaymentStatus });
      if (response.data.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, paymentStatus: newPaymentStatus } : o));
        setTimeout(() => fetchOrders(), 1000);
      }
    } catch (error) {
      alert(`❌ ${error.response?.data?.message || error.message}`);
    } finally {
      setStatusUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const getStatusOptions = (currentStatus) => {
    const all = [
      { value: 'pending', label: 'Pending' },
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'processing', label: 'Processing' },
      { value: 'shipped', label: 'Shipped' },
      { value: 'delivered', label: 'Delivered' },
      { value: 'cancelled', label: 'Cancelled' },
    ];
    const flow = {
      pending: ['pending', 'confirmed', 'processing', 'cancelled'],
      confirmed: ['confirmed', 'processing', 'shipped', 'cancelled'],
      processing: ['processing', 'shipped', 'cancelled'],
      shipped: ['shipped', 'delivered', 'cancelled'],
      delivered: ['delivered'],
      cancelled: ['cancelled'],
    };
    return all.filter(s => (flow[currentStatus] || [currentStatus]).includes(s.value));
  };

  const getPaymentStatusOptions = (current) => {
    const all = [
      { value: 'pending', label: 'Pending' },
      { value: 'completed', label: 'Completed' },
      { value: 'failed', label: 'Failed' },
      { value: 'refunded', label: 'Refunded' },
    ];
    const flow = {
      pending: ['pending', 'completed', 'failed'],
      completed: ['completed', 'refunded'],
      failed: ['failed'],
      refunded: ['refunded'],
    };
    return all.filter(s => (flow[current] || [current]).includes(s.value));
  };

  const getDeliveryStatusBadge = (status) => {
    if (!status) return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-800 whitespace-nowrap">Unassigned</span>;
    const cfg = {
      unassigned: { color: 'bg-gray-100 text-gray-800', label: 'Unassigned' },
      assigned: { color: 'bg-blue-100 text-blue-800', label: 'Assigned' },
      picked_up: { color: 'bg-yellow-100 text-yellow-800', label: 'Picked Up' },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      returned: { color: 'bg-red-100 text-red-800', label: 'Returned' }
    };
    const c = cfg[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${c.color}`}>{c.label}</span>;
  };

  const isRefundable = (order) => order && order.orderStatus === 'cancelled' && order.paymentStatus === 'completed' && order.refundStatus !== 'completed';

  const processRefund = async (order) => {
    if (!order || !isRefundable(order)) { alert('This order cannot be refunded'); return; }
    const refundAmount = order.finalAmount || order.totalAmount || 0;
    if (!confirm(`Refund ₹${refundAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}?`)) return;
    try {
      setRefundLoading(true);
      setActiveRefundOrderId(order._id);
      const response = await ordersAPI.processRefund(order._id, { amount: refundAmount, reason: 'Customer requested refund' });
      if (response.data.success) {
        setOrders(prev => prev.map(o => o._id === order._id ? { ...o, paymentStatus: 'refunded', refundStatus: 'completed' } : o));
        alert('✅ Refund processed');
        setTimeout(() => fetchOrders(), 1500);
      }
    } catch (error) {
      alert(`❌ Refund failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setRefundLoading(false);
      setTimeout(() => setActiveRefundOrderId(null), 2000);
    }
  };

  const fetchOrderReceipt = async (orderId) => {
    try {
      if (!orderId) { alert('Order ID missing'); return; }
      setReceiptLoading(true);
      const response = await ordersAPI.printOrderReceipt(orderId);
      setSelectedOrder(response.data || response);
      setShowReceiptModal(true);
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setReceiptLoading(false);
    }
  };

  const downloadPDFReceipt = async (orderId) => {
    try {
      if (!orderId) { alert('Order ID missing'); return; }
      setReceiptLoading(true);
      setDownloadStatus('Starting download...');
      const response = await ordersAPI.printOrderReceiptPDF(orderId, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `order-receipt-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setDownloadStatus('PDF downloaded successfully!');
    } catch (err) {
      alert(`Download failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setReceiptLoading(false);
      setTimeout(() => setDownloadStatus(''), 3000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return 'Invalid Date'; }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

  const getStatusBadge = (status) => {
    if (!status) return null;
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      refunded: 'bg-purple-100 text-purple-800'
    };
    return <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    if (!paymentStatus) return null;
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800'
    };
    return <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${colors[paymentStatus] || 'bg-gray-100 text-gray-800'}`}>{paymentStatus}</span>;
  };

  // ✅ includes alternatePhone
  const getCustomerInfo = (order) => {
    const name = order.name || order.shippingAddress?.name || order.customer?.name || order.user?.name || order.customerName || order.guestUser?.name || 'Customer';
    const email = order.shippingAddress?.email || order.customer?.email || order.user?.email || order.customerEmail || order.guestUser?.email || order.email || '';
    const phone = order.shippingAddress?.phone || order.customer?.phone || order.user?.phone || order.phoneNumber || order.guestUser?.phone || '';

    const alternatePhone =
      order.alternatePhone ||
      order.altPhone ||
      order.alternativePhone ||
      order.phone2 ||
      order.secondaryPhone ||
      order.phoneNumber2 ||
      order.shippingAddress?.alternatePhone ||
      order.shippingAddress?.altPhone ||
      order.shippingAddress?.alternativePhone ||
      order.customer?.alternatePhone ||
      order.customer?.altPhone ||
      '';

    const isGuest = !order.user || (typeof order.user === 'string' && !order.user);
    return { name, email, phone, alternatePhone, isGuest };
  };

  const getOrderId = (order) => {
    if (!order) return null;
    if (order.receipt) return order.receipt.receiptNumber || order.receipt._id || order.receipt.orderId || order.receipt.id;
    return order._id || order.id || order.orderId;
  };

  const buildProductSummary = (order, limit = null) => {
    const products = order.products || [];
    if (products.length === 0) return 'No items';

    const list = limit ? products.slice(0, limit) : products;

    const parts = list.map(p => {
      const name = p.name || 'Item';
      const weight = p.weight && p.weight > 0
        ? ` (${p.weight}${p.weightUnit === 'gram' ? 'g' : p.weightUnit === 'kg' ? 'kg' : p.weightUnit || ''})`
        : '';
      const qty = p.quantity ? ` , quantity : ${p.quantity}` : '';
      return `${name}${weight}${qty}`;
    });

    const more = limit && products.length > limit ? ` +${products.length - limit} more` : '';
    return parts.join(', ') + more;
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.orderStatus === 'pending').length;
  const deliveredOrders = orders.filter(o => o.orderStatus === 'delivered' || o.orderStatus === 'completed').length;
  const cancelledOrders = orders.filter(o => o.orderStatus === 'cancelled').length;
  const selectedCount = selectedOrderIds.size;

  // ============================================================
  // Order Card
  // ============================================================
  const OrderCard = ({ order, index, viewMode = 'grid', expanded = false, onToggleExpand }) => {
    const customer = getCustomerInfo(order);
    const orderId = getOrderId(order);
    const isRefundableOrder = isRefundable(order);
    const assigned = getAssignedBoy(order);
    const statusOptionsList = getStatusOptions(order.orderStatus);
    const paymentStatusOptionsList = getPaymentStatusOptions(order.paymentStatus);
    const isUpdating = statusUpdating[order._id];
    const isAssigning = assigningOrderId === order._id;
    const isSelected = selectedOrderIds.has(order._id);
    const isListView = viewMode === 'list';

    return (
      <div
        className={`rounded-xl border-2 shadow-sm hover:shadow-md transition-all overflow-hidden ${
          isSelected
            ? 'border-[#ff0000] ring-2 sm:ring-4 ring-[#ff0000]/25 bg-red-50/50'
            : 'border-gray-200 bg-white'
        } ${isListView ? 'w-full' : ''}`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b ${isSelected ? 'bg-red-100/70 border-red-200' : 'bg-gradient-to-r from-gray-50 to-white border-gray-200'}`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleOrderSelect(order._id); }}
              className={`flex-shrink-0 w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all border-2 ${
                isSelected
                  ? 'bg-[#ff0000] border-[#ff0000] text-white shadow-md'
                  : 'bg-white border-gray-300 text-gray-400 hover:border-[#ff0000] hover:text-[#ff0000]'
              }`}
              aria-label={isSelected ? 'Deselect order' : 'Select order'}
            >
              {isSelected ? <FaCheck size={13} className="sm:w-4 sm:h-4" /> : <FaSquare size={11} className="sm:w-3.5 sm:h-3.5" />}
            </button>

            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold flex-shrink-0 ${isSelected ? 'bg-[#ff0000] text-white' : 'bg-[#ff0000]/10 text-[#ff0000]'}`}>
              {index + 1}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-mono font-bold text-gray-800 truncate">
                #{order.orderId || order._id?.slice(-8)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-gray-500 truncate">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {getStatusBadge(order.orderStatus)}
            {getPaymentStatusBadge(order.paymentStatus)}

            {isListView && (
              <button
                type="button"
                onClick={onToggleExpand}
                className="ml-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
                aria-label={expanded ? 'Collapse' : 'Expand'}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className={`text-gray-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
                >
                  <path d="M8 11L3 6h10L8 11z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* List view — compact summary when NOT expanded */}
        {isListView && !expanded && (
          <div className="px-3 sm:px-4 py-2.5 sm:py-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-[13px] mb-1.5">
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <FaUser className="text-gray-400 flex-shrink-0" size={11} />
                <span className="font-semibold text-gray-800 truncate">{customer.name}</span>
              </span>

              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="inline-flex items-center gap-1.5 text-[#ff0000] hover:underline whitespace-nowrap">
                  <FaPhone size={10} /> {customer.phone}
                </a>
              )}

              {customer.alternatePhone && (
                <a href={`tel:${customer.alternatePhone}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:underline whitespace-nowrap" title="Alternate phone">
                  <FaPhone size={10} /> {customer.alternatePhone}
                  <span className="text-[9px] font-semibold px-1 rounded bg-blue-100 text-blue-700">ALT</span>
                </a>
              )}
            </div>

            {(order.wardName || order.typedArea || order.shippingAddress?.city) && (
              <div className="flex items-start gap-1.5 text-[11px] sm:text-xs text-gray-600 mb-1.5">
                <FaMapMarkerAlt className="text-gray-400 flex-shrink-0 mt-0.5" size={11} />
                <span className="break-words min-w-0">
                  {order.wardName ? `Ward ${order.wardId} — ${order.wardName}` : order.typedArea || order.shippingAddress?.city}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] sm:text-xs">
              <span className="inline-flex items-center gap-1 text-gray-600 min-w-0">
                <FaBox className="text-gray-400 flex-shrink-0" size={11} />
                <span className="truncate">
                  {buildProductSummary(order, 1)}
                </span>
              </span>

              <span className="inline-flex items-center gap-1 min-w-0">
                <FaTruck className={assigned ? 'text-green-600 flex-shrink-0' : 'text-gray-400 flex-shrink-0'} size={11} />
                <span className={`truncate ${assigned ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                  {assigned ? assigned.name : 'Unassigned'}
                </span>
              </span>

              <span className="font-bold text-gray-900 whitespace-nowrap">{formatCurrency(order.finalAmount || 0)}</span>

              <div className="flex gap-1.5 ml-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); openAssignModal(order); }}
                  disabled={isAssigning}
                  className="px-2.5 py-1 bg-[#ff0000] hover:bg-[#cc0000] text-white text-[10px] rounded font-semibold disabled:opacity-50 whitespace-nowrap"
                >
                  {assigned ? 'Change' : 'Assign'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); fetchOrderReceipt(orderId); }}
                  className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] rounded font-semibold whitespace-nowrap"
                >
                  🧾 Receipt
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                  className="px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white text-[10px] rounded font-semibold whitespace-nowrap"
                >
                  View
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full details */}
        {(!isListView || expanded) && (
          <>
            <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* LEFT */}
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-start gap-2">
                  <FaUser className="text-gray-400 mt-0.5 flex-shrink-0" size={12} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{customer.name}</p>

                    {customer.phone && (
                      <a href={`tel:${customer.phone}`} className="text-[11px] text-[#ff0000] hover:underline flex items-center gap-1 break-all">
                        <FaPhone size={9} className="flex-shrink-0" /> {customer.phone}
                      </a>
                    )}

                    {customer.alternatePhone && (
                      <a href={`tel:${customer.alternatePhone}`} className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 break-all" title="Alternate phone">
                        <FaPhone size={9} className="flex-shrink-0" /> {customer.alternatePhone}
                        <span className="text-[9px] font-semibold px-1 rounded bg-blue-100 text-blue-700">ALT</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <FaMapMarkerAlt className="text-gray-400 mt-0.5 flex-shrink-0" size={12} />
                  <div className="min-w-0 text-[11px] text-gray-600 space-y-0.5">
                    {order.wardName && <p className="text-blue-700 font-medium break-words">Ward {order.wardId} — {order.wardName}</p>}
                    {order.typedArea && <p className="text-orange-700 break-words">🏠 {order.typedArea}</p>}
                    {order.shippingAddress?.street && <p className="break-words">📍 {order.shippingAddress.street}</p>}
                    {order.shippingAddress?.city && (
                      <p className="break-words">🏙️ {order.shippingAddress.city}{order.shippingAddress.postalCode ? ` - ${order.shippingAddress.postalCode}` : ''}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <FaBox className="text-gray-400 mt-0.5 flex-shrink-0" size={12} />
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-600 break-words">
                      <b>{order.products?.length || 0}</b> item(s)
                      {order.products?.[0] && (
                        <span className="text-gray-500">
                          {' — '}
                          {buildProductSummary(order, 1).replace(/^\d+ item\(s\) — /, '')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="space-y-2.5 sm:space-y-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1 mb-1">
                    <FaTruck size={10} /> Delivery Boy
                  </label>
                  <button
                    type="button"
                    onClick={() => openAssignModal(order)}
                    disabled={isAssigning}
                    className={`w-full flex items-center justify-between gap-2 text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-[#ff0000] transition-colors text-left ${isAssigning ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className="min-w-0 flex items-center gap-2">
                      <FaTruck className={assigned ? 'text-green-600 flex-shrink-0' : 'text-gray-400 flex-shrink-0'} size={11} />
                      <span className={`font-medium truncate ${assigned ? 'text-gray-800' : 'text-gray-500'}`}>
                        {assigned ? assigned.name : 'Choose Delivery Boy'}
                      </span>
                    </span>
                    <span className="text-[10px] text-[#ff0000] font-semibold flex-shrink-0">
                      {assigned ? 'Change' : 'Select'}
                    </span>
                  </button>
                  {assigned && (
                    <p className="mt-1 text-[10px] text-gray-500 flex items-start gap-1">
                      <FaMapMarkerAlt className="mt-0.5 flex-shrink-0" size={9} />
                      <span className="break-words">{getBoyLocation(assigned)}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-500">Total</p>
                    <p className="text-sm sm:text-base font-bold text-gray-800 truncate">{formatCurrency(order.finalAmount || 0)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-gray-500">Delivery</p>
                    {getDeliveryStatusBadge(order.deliveryStatus)}
                  </div>
                </div>

                {userRole === 'admin' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="min-w-0">
                      <label className="text-[10px] text-gray-500 block mb-0.5">Order Status</label>
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        disabled={isUpdating}
                        className="w-full text-[11px] border border-gray-300 rounded-lg px-2 py-1.5 bg-white"
                      >
                        {statusOptionsList.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div className="min-w-0">
                      <label className="text-[10px] text-gray-500 block mb-0.5">Payment Status</label>
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => handlePaymentStatusUpdate(order._id, e.target.value)}
                        disabled={isUpdating}
                        className="w-full text-[11px] border border-gray-300 rounded-lg px-2 py-1.5 bg-white"
                      >
                        {paymentStatusOptionsList.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={`px-3 sm:px-4 py-2.5 sm:py-3 border-t flex flex-wrap gap-2 ${isSelected ? 'bg-red-50/70 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
              <button
                onClick={() => fetchOrderReceipt(orderId)}
                className="flex-1 min-w-[100px] bg-gradient-to-r from-[#ff0000] to-[#cc0000] hover:from-[#cc0000] hover:to-[#aa0000] text-white px-3 py-2 rounded-lg text-[11px] sm:text-xs font-medium transition-colors"
              >
                🧾 Receipt
              </button>
              {userRole === 'admin' && (
                <button
                  onClick={() => setDeleteModal({ show: true, orderId: order._id, orderNumber: order.orderId })}
                  className="flex-1 min-w-[100px] bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-[11px] sm:text-xs font-medium transition-colors"
                >
                  🗑️ Delete
                </button>
              )}
              {isRefundableOrder && (
                <button
                  onClick={() => processRefund(order)}
                  disabled={refundLoading && activeRefundOrderId === order._id}
                  className="flex-1 min-w-[100px] bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-[11px] sm:text-xs font-medium transition-colors disabled:opacity-50"
                >
                  💰 Refund
                </button>
              )}
              {isListView && (
                <button
                  onClick={onToggleExpand}
                  className="flex-1 min-w-[100px] bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-[11px] sm:text-xs font-medium transition-colors"
                >
                  ▲ Collapse
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // ============================================================
  // Assign Delivery Boy Modal (single)
  // ============================================================
  const AssignDeliveryBoyModal = ({ order, boys, searchTerm, setSearchTerm, onClose, onSelect, busy }) => {
    if (!order) return null;

    const currentlyAssignedId = (() => {
      const a = getAssignedBoy(order);
      return a?._id || a?.id || '';
    })();

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-2 sm:p-4 z-50">
        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
          <div className="p-3 sm:p-4 border-b flex justify-between items-center bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white rounded-t-xl">
            <div className="flex items-center gap-2 min-w-0">
              <FaTruck className="flex-shrink-0" />
              <div className="min-w-0">
                <h2 className="font-bold text-sm sm:text-base truncate">Choose Delivery Boy</h2>
                <p className="text-white/80 text-[11px] truncate">
                  Order #{order.orderId || order._id?.slice(-8)} • {order.wardName ? `Ward ${order.wardId}` : order.shippingAddress?.city || ''}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/20 rounded hover:bg-white/30 flex-shrink-0">✕</button>
          </div>

          <div className="p-3 border-b bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                autoFocus
                placeholder="Search by name, phone, ward, city, area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#ff0000] focus:border-transparent bg-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {boys.length === 0 ? (
              <div className="text-center py-12 px-4">
                <FaTruck className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-sm font-medium text-gray-700">No delivery boys found</p>
                <p className="text-xs text-gray-500 mt-1">
                  {searchTerm ? 'Try a different search term.' : 'Add delivery boys first.'}
                </p>
              </div>
            ) : (
              boys.map((boy) => {
                const id = boy._id || boy.id;
                const isCurrently = currentlyAssignedId === id;
                return (
                  <button
                    key={id}
                    onClick={() => onSelect(id)}
                    disabled={busy || isCurrently}
                    className={`w-full flex items-start gap-3 px-3 sm:px-4 py-3 text-left border-b transition-colors ${isCurrently ? 'bg-green-50 cursor-default' : 'hover:bg-gray-50 cursor-pointer'}`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isCurrently ? 'bg-green-500' : 'bg-[#ff0000]/10'}`}>
                      <span className={`text-sm font-bold ${isCurrently ? 'text-white' : 'text-[#ff0000]'}`}>
                        {(boy.name || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800 truncate">{boy.name}</p>
                        {isCurrently && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full whitespace-nowrap">
                            CURRENT
                          </span>
                        )}
                      </div>
                      {boy.phone && (
                        <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                          <FaPhone size={9} className="flex-shrink-0" /> {boy.phone}
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {boy.city && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                            <FaMapMarkerAlt size={8} /> {boy.city.toUpperCase()}
                          </span>
                        )}
                        {Array.isArray(boy.wardIds) && boy.wardIds.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800">
                            Wards {boy.wardIds.join(',')}
                          </span>
                        )}
                        {Array.isArray(boy.areas) && boy.areas.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-800 break-words">
                            {boy.areas.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-3 border-t bg-gray-50 text-center text-[11px] text-gray-500">
            {boys.length} delivery boy{boys.length !== 1 ? 's' : ''} shown
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // BULK Assign Modal
  // ============================================================
  const BulkAssignModal = ({ count, boys, searchTerm, setSearchTerm, onClose, onSelect, busy }) => {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-2 sm:p-4 z-50">
        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
          <div className="p-3 sm:p-4 border-b flex justify-between items-center bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white rounded-t-xl">
            <div className="flex items-center gap-2 min-w-0">
              <FaTruck className="flex-shrink-0" />
              <div className="min-w-0">
                <h2 className="font-bold text-sm sm:text-base truncate">Assign {count} order{count !== 1 ? 's' : ''}</h2>
                <p className="text-white/80 text-[11px] truncate">
                  Same delivery boy will be set for all selected orders
                </p>
              </div>
            </div>
            <button onClick={onClose} disabled={busy} className="w-8 h-8 flex items-center justify-center bg-white/20 rounded hover:bg-white/30 flex-shrink-0 disabled:opacity-50">✕</button>
          </div>

          <div className="p-3 border-b bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                autoFocus
                disabled={busy}
                placeholder="Search by name, phone, ward, city, area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#ff0000] focus:border-transparent bg-white disabled:opacity-60"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {boys.length === 0 ? (
              <div className="text-center py-12 px-4">
                <FaTruck className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-sm font-medium text-gray-700">No delivery boys found</p>
                <p className="text-xs text-gray-500 mt-1">
                  {searchTerm ? 'Try a different search term.' : 'Add delivery boys first.'}
                </p>
              </div>
            ) : (
              boys.map((boy) => {
                const id = boy._id || boy.id;
                return (
                  <button
                    key={id}
                    onClick={() => onSelect(id)}
                    disabled={busy}
                    className="w-full flex items-start gap-3 px-3 sm:px-4 py-3 text-left border-b hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#ff0000]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-[#ff0000]">
                        {(boy.name || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">{boy.name}</p>
                      {boy.phone && (
                        <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                          <FaPhone size={9} className="flex-shrink-0" /> {boy.phone}
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {boy.city && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                            <FaMapMarkerAlt size={8} /> {boy.city.toUpperCase()}
                          </span>
                        )}
                        {Array.isArray(boy.wardIds) && boy.wardIds.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800">
                            Wards {boy.wardIds.join(',')}
                          </span>
                        )}
                        {Array.isArray(boy.areas) && boy.areas.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-800 break-words">
                            {boy.areas.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-3 border-t bg-gray-50 text-center text-[11px] text-gray-500">
            {busy ? 'Assigning orders...' : `${boys.length} delivery boy${boys.length !== 1 ? 's' : ''} shown`}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // ✅ NEW — BULK Delete Confirmation Modal
  // ============================================================
  const BulkDeleteModal = ({ count, onClose, onConfirm, busy }) => {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
            <span className="text-red-600 text-2xl">🗑️</span>
          </div>

          <h3 className="text-lg font-bold text-center text-gray-900 mb-2">
            Delete {count} Order{count !== 1 ? 's' : ''}?
          </h3>

          <p className="text-gray-600 text-sm text-center mb-6">
            You are about to permanently delete{' '}
            <strong className="text-red-600">{count} order{count !== 1 ? 's' : ''}</strong>.
            This action <strong>cannot be undone</strong>.
          </p>

          {busy && (
            <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
              Deleting orders...
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={busy}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {busy ? 'Deleting...' : '🗑️ Yes, Delete All'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // Receipt Modal
  // ============================================================
  const ReceiptModal = ({ order, onClose, onDownloadPDF }) => {
    if (!order) return null;
    const receiptData = order.receipt || order;
    const orderId = receiptData.receiptNumber || receiptData.orderNumber || receiptData.orderId || receiptData._id;
    const customerName = receiptData.name || receiptData.shippingAddress?.name || receiptData.customer?.name || 'Customer';
    const customerEmail = receiptData.customer?.email || receiptData.user?.email || receiptData.shippingAddress?.email || receiptData.email || 'N/A';
    const customerPhone = receiptData.customer?.phone || receiptData.user?.phone || receiptData.shippingAddress?.phone || 'N/A';

    const customerAltPhone =
      receiptData.alternatePhone ||
      receiptData.altPhone ||
      receiptData.alternativePhone ||
      receiptData.shippingAddress?.alternatePhone ||
      receiptData.shippingAddress?.altPhone ||
      receiptData.customer?.alternatePhone ||
      '';

    const items = receiptData.products || receiptData.items || [];
    const subtotal = receiptData.pricing?.subtotal || receiptData.totalAmount || 0;
    const shipping = receiptData.pricing?.shipping || receiptData.shippingFee || 0;
    const tax = receiptData.pricing?.tax || receiptData.taxAmount || 0;
    const total = receiptData.pricing?.total || receiptData.finalAmount || 0;
    const orderDate = receiptData.createdAt || receiptData.orderDate || receiptData.date;
    const paymentStatus = receiptData.payment?.status || receiptData.paymentStatus;
    const paymentMethod = receiptData.payment?.method || receiptData.paymentMethod;
    const orderStatus = receiptData.orderStatus;
    const shippingAddress = receiptData.shippingAddress;

    const formatWeight = (item) => {
      if (!item.weight || item.weight <= 0) return null;
      const unit = item.weightUnit === 'gram' ? 'g' : item.weightUnit === 'kg' ? 'kg' : (item.weightUnit || 'g');
      return `${item.weight}${unit}`;
    };

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-2 sm:p-4 z-50">
        <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
          <div className="bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white p-3 sm:p-4 flex justify-between items-center rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-base">🛒</div>
              <div>
                <h1 className="font-bold text-sm sm:text-base">ORDER RECEIPT</h1>
                <p className="text-white/80 text-xs">#{orderId?.substring(0, 12)}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/20 rounded hover:bg-white/30">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            <div className="mb-4 space-y-2">
              <div className="flex justify-between"><span className="text-xs text-gray-500">Date:</span><span className="text-xs font-medium">{formatDate(orderDate)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-gray-500">Payment:</span>{getPaymentStatusBadge(paymentStatus)}</div>
              <div className="flex justify-between"><span className="text-xs text-gray-500">Status:</span>{getStatusBadge(orderStatus)}</div>
              <div className="flex justify-between"><span className="text-xs text-gray-500">Method:</span><span className="text-xs capitalize font-medium">{paymentMethod}</span></div>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg border text-xs space-y-1">
              <div className="flex items-center gap-1"><span>👤</span><span className="font-medium">{customerName}</span></div>
              {customerEmail !== 'N/A' && <div className="flex items-center gap-1"><span>✉️</span><span className="break-all">{customerEmail}</span></div>}

              <div className="flex items-center gap-1">
                <span>📞</span>
                <span>{customerPhone}</span>
              </div>

              {customerAltPhone && (
                <div className="flex items-center gap-1">
                  <span>📞</span>
                  <span>{customerAltPhone}</span>
                  <span className="text-[9px] font-semibold px-1 rounded bg-blue-100 text-blue-700">ALT</span>
                </div>
              )}

              {shippingAddress && (
                <div className="mt-2 pt-2 border-t space-y-1">
                  <div className="font-medium text-gray-600">Shipping Address:</div>
                  <div><b>Street:</b> {shippingAddress.street || '—'}</div>
                  <div><b>City:</b> {shippingAddress.city || '—'}</div>
                  <div><b>State / PIN:</b> {[shippingAddress.state, shippingAddress.postalCode].filter(Boolean).join(' - ') || '—'}</div>
                </div>
              )}
            </div>

            <div className="mb-4">
              <h3 className="font-bold text-sm mb-2">Items ({items.length})</h3>
              <div className="space-y-2">
                {items.map((item, i) => {
                  const weight = formatWeight(item);
                  return (
                    <div key={i} className="flex justify-between border-b pb-2 text-xs gap-2">
                      <div className="min-w-0">
                        <div className="font-medium break-words">{item.product?.name || item.name}</div>
                        {item.variantName && <div className="text-gray-500">{item.variantName}</div>}
                        {weight && (
                          <div className="text-gray-500">Weight: {weight}</div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-medium">{formatCurrency((item.price || 0) * (item.quantity || 1))}</div>
                        <div className="text-gray-500">{item.quantity} Quantity × {formatCurrency(item.price || 0)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#ff0000]/10 p-3 rounded-lg border border-[#ff0000]/20 text-xs space-y-1">
              <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span>Shipping:</span><span>{formatCurrency(shipping)}</span></div>
              <div className="flex justify-between"><span>Tax:</span><span>{formatCurrency(tax)}</span></div>
              <div className="flex justify-between font-bold pt-2 border-t border-[#ff0000]/30 text-sm"><span>TOTAL:</span><span className="text-[#ff0000]">{formatCurrency(total)}</span></div>
            </div>
          </div>

          <div className="p-3 sm:p-4 border-t bg-gray-50 flex justify-end rounded-b-xl">
            <button onClick={onDownloadPDF} disabled={receiptLoading} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
              📥 Download PDF
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Delete Confirmation Modal (single)
  const DeleteConfirmationModal = ({ show, onClose, onConfirm, orderNumber }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
            <span className="text-red-600 text-xl">🗑️</span>
          </div>
          <h3 className="text-lg font-bold text-center mb-2">Delete Order</h3>
          <p className="text-gray-600 text-sm text-center mb-6">Delete order #{orderNumber}? This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium">Delete</button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50"><Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff0000] mx-auto"></div>
            <p className="mt-3 text-sm text-gray-500">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 w-full min-w-0">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-3 sm:px-4 py-3">
            <h1 className="text-base sm:text-xl font-bold text-gray-800 truncate">Orders Management</h1>
            <button onClick={logout} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center text-sm flex-shrink-0">
              <span className="hidden sm:inline mr-2">Logout</span><LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="p-3 sm:p-6 max-w-7xl mx-auto w-full">
  {/* Heading + Actions */}
<div className="flex flex-col gap-3 mb-4">

  {/* Row 1: Title (full width) */}
  <div className="min-w-0">
    <h2 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
      <FaTag className="text-[#ff0000] flex-shrink-0" size={16} />
      All Orders
    </h2>
    <p className="text-xs text-gray-500 mt-0.5">
      {filteredOrders.length} of {totalOrders} orders
      {selectedCount > 0 && (
        <span className="ml-2 text-[#ff0000] font-semibold">
          • {selectedCount} selected
        </span>
      )}
    </p>
  </div>

  {/* Row 2: Bulk actions — only when 2+ selected */}
{selectedCount >= 2 && (
  <div className="fixed top-12 mt-6.5 right-2 left-2 sm:top-16 sm:left-auto sm:right-6 z-30 bg-red-50 border border-red-300 sm:border-2 rounded-lg sm:rounded-xl p-1.5 sm:p-3 shadow-lg sm:shadow-xl">
    <div className="flex items-center gap-1.5 sm:gap-3">

      {/* Count */}
      <span className="text-[10px] sm:text-sm font-bold text-[#ff0000] whitespace-nowrap">
        {selectedCount}
      </span>

      {/* Buttons */}
      <div className="flex gap-1 sm:gap-2 flex-1">
        <button
          onClick={() => { setBulkAssignModalOpen(true); setBulkAssignSearchTerm(''); }}
          className="flex-1 sm:flex-none bg-[#ff0000] active:bg-[#990000] text-white px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-semibold flex items-center justify-center gap-0.5 sm:gap-1.5 whitespace-nowrap"
        >
          <FaTruck size={9} className="sm:hidden" />
          <FaTruck size={11} className="hidden sm:block" />
          <span>Assign</span>
        </button>

        <button
          onClick={() => setBulkDeleteModalOpen(true)}
          className="flex-1 sm:flex-none bg-red-600 active:bg-red-800 text-white px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-semibold flex items-center justify-center gap-0.5 sm:gap-1.5 whitespace-nowrap"
        >
          <span>🗑️</span>
          <span>Delete</span>
        </button>

        <button
          onClick={clearSelection}
          className="flex-1 sm:flex-none bg-white border border-gray-300 active:bg-gray-100 text-gray-700 px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-semibold whitespace-nowrap"
        >
          Clear
        </button>
      </div>
    </div>
  </div>
)}

  {/* Row 3: Primary actions — Grid/List + PDF + Refresh */}
  <div className="flex flex-wrap items-center gap-2">

    {/* Grid / List toggle */}
    <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setViewMode('grid')}
        className={`px-3 py-2 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors ${
          viewMode === 'grid' ? 'bg-[#ff0000] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
        title="Grid view"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <rect x="0" y="0" width="7" height="7" rx="1" />
          <rect x="9" y="0" width="7" height="7" rx="1" />
          <rect x="0" y="9" width="7" height="7" rx="1" />
          <rect x="9" y="9" width="7" height="7" rx="1" />
        </svg>
        <span className="hidden sm:inline">Grid</span>
      </button>
      <button
        type="button"
        onClick={() => { setViewMode('list'); setExpandedOrderId(null); }}
        className={`px-3 py-2 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors border-l border-gray-300 ${
          viewMode === 'list' ? 'bg-[#ff0000] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
        title="List view"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <rect x="0" y="0" width="16" height="3" rx="1" />
          <rect x="0" y="6.5" width="16" height="3" rx="1" />
          <rect x="0" y="13" width="16" height="3" rx="1" />
        </svg>
        <span className="hidden sm:inline">List</span>
      </button>
    </div>

    {/* PDF button — grows on mobile, auto on desktop */}
    <button
      onClick={handleDownloadTodayOrders}
      disabled={downloadingToday}
      className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm whitespace-nowrap"
    >
      {downloadingToday ? (
        <>📄...</>
      ) : (
        <>
          <span className="hidden sm:inline">📄 Today's Orders PDF</span>
          <span className="sm:hidden">📄 PDF</span>
        </>
      )}
    </button>

    {/* Refresh — grows on mobile, auto on desktop */}
    <button
      onClick={handleRefresh}
      disabled={refreshing}
      className="flex-1 sm:flex-none bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm whitespace-nowrap"
    >
      <FaSyncAlt className={refreshing ? 'animate-spin' : ''} size={11} />
      <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
    </button>
  </div>
</div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
            {[
              { label: 'Total Orders', value: totalOrders, gradient: 'from-blue-500 to-blue-600' },
              { label: 'Pending', value: pendingOrders, gradient: 'from-yellow-500 to-yellow-600' },
              { label: 'Delivered', value: deliveredOrders, gradient: 'from-green-500 to-green-600' },
              { label: 'Cancelled', value: cancelledOrders, gradient: 'from-red-500 to-red-600' }
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 min-w-0">
                <p className="text-gray-500 text-[10px] sm:text-xs font-medium truncate">{c.label}</p>
                <p className={`text-lg sm:text-2xl font-bold mt-1 bg-gradient-to-r ${c.gradient} bg-clip-text text-transparent`}>{c.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="relative sm:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Search order, name, phone, city, ward..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#ff0000] focus:border-transparent"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#ff0000] focus:border-transparent"
              >
                {statusOptions.map(o => <option key={o.value} value={o.value}>{o.icon} {o.label}</option>)}
              </select>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#ff0000] focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount-high">Amount (High to Low)</option>
                <option value="amount-low">Amount (Low to High)</option>
              </select>
            </div>
          </div>

          {error && (
            <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${error.includes('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {error}
            </div>
          )}

          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
              <Search className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-3 text-sm font-medium text-gray-700">No orders found</h3>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4' : 'space-y-2 sm:space-y-3'}>
              {filteredOrders.map((order, index) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  index={index}
                  viewMode={viewMode}
                  expanded={expandedOrderId === order._id}
                  onToggleExpand={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {assignModalOrder && (
        <AssignDeliveryBoyModal
          order={assignModalOrder}
          boys={filteredBoysForAssign}
          searchTerm={assignSearchTerm}
          setSearchTerm={setAssignSearchTerm}
          busy={assigningOrderId === assignModalOrder._id}
          onClose={closeAssignModal}
          onSelect={async (boyId) => {
            await handleAssignDeliveryBoy(assignModalOrder._id, boyId);
            closeAssignModal();
          }}
        />
      )}

      {bulkAssignModalOpen && (
        <BulkAssignModal
          count={selectedCount}
          boys={filteredBoysForBulkAssign}
          searchTerm={bulkAssignSearchTerm}
          setSearchTerm={setBulkAssignSearchTerm}
          busy={bulkAssigning}
          onClose={() => { setBulkAssignModalOpen(false); setBulkAssignSearchTerm(''); }}
          onSelect={(boyId) => handleBulkAssign(boyId)}
        />
      )}

      {/* ✅ Bulk Delete Modal */}
      {bulkDeleteModalOpen && (
        <BulkDeleteModal
          count={selectedCount}
          busy={bulkDeleting}
          onClose={() => setBulkDeleteModalOpen(false)}
          onConfirm={handleBulkDelete}
        />
      )}

      {showReceiptModal && (
        <ReceiptModal
          order={selectedOrder}
          onClose={() => setShowReceiptModal(false)}
          onDownloadPDF={() => {
            const orderId = selectedOrder?.receipt?.receiptNumber || selectedOrder?.receipt?._id || selectedOrder?.receipt?.orderId || selectedOrder?._id || selectedOrder?.orderId;
            if (!orderId) return;
            downloadPDFReceipt(orderId);
          }}
        />
      )}

      <DeleteConfirmationModal
        show={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, orderId: null, orderNumber: null })}
        onConfirm={() => handleDeleteOrder(deleteModal.orderId, deleteModal.orderNumber)}
        orderNumber={deleteModal.orderNumber}
      />
    </div>
  );
};

export default OrdersPage;