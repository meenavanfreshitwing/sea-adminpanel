// src/pages/CustomerPage.jsx (Updated)
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Trash2,
  Mail,
  Phone,
  Calendar,
  Shield,
  User,
  RefreshCw,
  LogOut,
  Edit,
  Eye,
  MoreVertical
} from 'lucide-react';
import { adminAPI } from '../api/admin';
import CustomerDetailsModal from '../components/CustomerDetailsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';

const CustomerPage = () => {
  const { logout } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToAction, setCustomerToAction] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 100
  });

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch all customers
  const fetchCustomers = async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await adminAPI.getAllUsers({ limit: 100 });
      console.log('Full API Response:', response);
      
      // Handle different response structures from your backend
      let customersData = [];
      let paginationData = {};
      
      // Check response structure
      if (response.data) {
        // Structure: { success: true, data: { users: [], pagination: {} } }
        if (response.data.success && response.data.data) {
          if (response.data.data.users) {
            customersData = response.data.data.users;
            paginationData = response.data.data.pagination || {};
          } else if (Array.isArray(response.data.data)) {
            customersData = response.data.data;
          } else {
            customersData = response.data.data;
          }
        }
        // Structure: { success: true, data: { users: [] } }
        else if (response.data.success && response.data.data?.users) {
          customersData = response.data.data.users;
          paginationData = response.data.data.pagination || {};
        }
        // Structure: { data: [] }
        else if (Array.isArray(response.data.data)) {
          customersData = response.data.data;
        }
        // Structure: just an array
        else if (Array.isArray(response.data)) {
          customersData = response.data;
        }
      }
      
      console.log('Extracted customers:', customersData);
      console.log('Number of customers:', customersData.length);
      
      setCustomers(customersData);
      setFilteredCustomers(customersData);
      setPagination({
        currentPage: paginationData.currentPage || 1,
        totalPages: paginationData.totalPages || 1,
        totalItems: paginationData.totalItems || customersData.length,
        itemsPerPage: paginationData.itemsPerPage || 100
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    fetchCustomers(true);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Search and filter logic
  useEffect(() => {
    let results = [...customers];

    if (searchTerm) {
      results = results.filter(customer =>
        (customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (customer.phoneNumber && customer.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedType !== 'all') {
      if (selectedType === 'admin') {
        results = results.filter(customer => customer.role === 'admin');
      } else if (selectedType === 'user') {
        results = results.filter(customer => customer.role === 'user');
      } else if (selectedType === 'active') {
        results = results.filter(customer => customer.isActive === true);
      } else if (selectedType === 'inactive') {
        results = results.filter(customer => customer.isActive === false);
      }
    }

    setFilteredCustomers(results);
  }, [searchTerm, selectedType, customers]);

  // Handle customer deactivation
  const handleDeactivate = async () => {
    if (!customerToAction) return;
    
    try {
      await adminAPI.deactivateUser(customerToAction._id);
      
      setCustomers(prev => prev.map(c => 
        c._id === customerToAction._id ? { ...c, isActive: false } : c
      ));
      setIsDeleteModalOpen(false);
      setCustomerToAction(null);
    } catch (error) {
      console.error('Deactivate error:', error);
    }
  };

  // Open modals
  const openDeactivateModal = (customer, e) => {
    if (e) e.stopPropagation();
    setCustomerToAction(customer);
    setIsDeleteModalOpen(true);
  };

  const openDetailsModal = (customer) => {
    setSelectedCustomer(customer);
    setIsDetailsModalOpen(true);
  };

  // Get role badge
  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Admin' },
      user: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'User' }
    };
    
    const config = roleConfig[role] || roleConfig.user;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Shield className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  // Get status badge
  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1"></span>
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <span className="w-1.5 h-1.5 bg-gray-600 rounded-full mr-1"></span>
        Inactive
      </span>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Mobile Card View Component
  const CustomerCard = ({ customer }) => (
    <div 
      className="bg-white rounded-lg shadow-md border border-gray-200 p-3.5 sm:p-4 mb-3 sm:mb-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => openDetailsModal(customer)}
    >
      <div className="flex justify-between items-start mb-2.5 sm:mb-3">
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
          <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-r from-[#ff0000] to-[#cc0000] rounded-full flex items-center justify-center text-white font-semibold text-base sm:text-lg flex-shrink-0">
            {customer.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
              {customer.name || 'Unnamed User'}
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
              {getRoleBadge(customer.role)}
              {getStatusBadge(customer.isActive)}
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-1.5 sm:space-y-2 mb-2.5 sm:mb-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-700 truncate">{customer.email || '-'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-700">{customer.phoneNumber || customer.phone || '-'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-700">Joined: {formatDate(customer.createdAt)}</span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex space-x-2 pt-2.5 sm:pt-3 border-t border-gray-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            openDeactivateModal(customer, e);
          }}
          className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition duration-200 flex items-center justify-center gap-1.5 sm:gap-2"
        >
          <Trash2 size={14} className="sm:w-[16px] sm:h-[16px]" />
          <span>Deactivate</span>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff0000] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading customers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 w-full overflow-x-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-4 md:px-6">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff0000] flex-shrink-0" />
              <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-800 truncate">Customer Management</h1>
            </div>
            <button
              onClick={logout}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 sm:px-4 py-2 rounded-lg transition duration-200 flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
            >
              <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>
            
        {/* Refresh Button - aligned properly on mobile */}
        <div className="px-4 md:px-6 pt-3 md:pt-4 flex justify-end">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center transition duration-200 text-xs sm:text-sm disabled:opacity-50 gap-1.5 sm:gap-2"
          >
            <RefreshCw size={14} className="sm:w-[16px] sm:h-[16px]" />
            <span>{refreshing ? 'Refreshing...' : ''}</span>
          </button>
        </div>
        
        {/* Filters and Search */}
        <div className="mx-4 md:mx-6 mt-3 md:mt-4 mb-4 md:mb-6 bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 md:gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0000] focus:border-transparent text-xs sm:text-sm md:text-base"
                />
              </div>
            </div>
            
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="flex-1 md:flex-none border border-gray-300 rounded-lg px-2.5 sm:px-3 py-2 sm:py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0000] text-xs sm:text-sm md:text-base"
              >
                <option value="all">All Users</option>
                <option value="admin">Admins Only</option>
                <option value="user">Regular Users Only</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            
          </div>
        </div>

        {/* Main Content */}
        <main className="px-4 md:px-6 pb-4 md:pb-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="bg-white rounded-lg shadow p-3 sm:p-4">
              <p className="text-[11px] sm:text-xs md:text-sm text-gray-500">Total Users</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mt-0.5 sm:mt-1">{customers.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-3 sm:p-4">
              <p className="text-[11px] sm:text-xs md:text-sm text-gray-500">Active Users</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 mt-0.5 sm:mt-1">
                {customers.filter(c => c.isActive).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-3 sm:p-4">
              <p className="text-[11px] sm:text-xs md:text-sm text-gray-500">Admins</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 mt-0.5 sm:mt-1">
                {customers.filter(c => c.role === 'admin').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-3 sm:p-4">
              <p className="text-[11px] sm:text-xs md:text-sm text-gray-500">Regular Users</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 mt-0.5 sm:mt-1">
                {customers.filter(c => c.role === 'user').length}
              </p>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-3 md:mb-4">
            <p className="text-xs sm:text-sm text-gray-600">
              Showing {filteredCustomers.length} of {customers.length} customers
            </p>
          </div>

          {/* Customer Table/Cards Display */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-10 sm:py-12">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900">No customers found</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                  Try adjusting your search or filter
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                {!isMobile ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCustomers.map((customer) => (
                          <tr 
                            key={customer._id} 
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => openDetailsModal(customer)}
                          >
                            <td className="py-4 px-6">
                              <div className="space-y-1">
                                {customer.email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600 truncate max-w-[200px]">{customer.email}</span>
                                  </div>
                                )}
                                {(customer.phoneNumber || customer.phone) && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">{customer.phoneNumber || customer.phone}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                {formatDate(customer.createdAt)}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              {getRoleBadge(customer.role)}
                            </td>
                            <td className="py-4 px-6">
                              {getStatusBadge(customer.isActive)}
                            </td>
                            <td className="py-4 px-6">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeactivateModal(customer, e);
                                }}
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 flex items-center gap-2"
                              >
                                <Trash2 size={16} />
                                Deactivate
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Mobile Card View */
                  <div className="p-3 sm:p-4">
                    {filteredCustomers.map((customer) => (
                      <CustomerCard key={customer._id} customer={customer} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Customer Details Modal */}
        {isDetailsModalOpen && selectedCustomer && (
          <CustomerDetailsModal
            customer={selectedCustomer}
            onClose={() => setIsDetailsModalOpen(false)}
            onDeactivate={openDeactivateModal}
          />
        )}

        {/* Deactivate Confirmation Modal */}
        {isDeleteModalOpen && customerToAction && (
          <ConfirmationModal
            isOpen={isDeleteModalOpen}
            title="Deactivate Customer"
            message={`Are you sure you want to deactivate ${customerToAction.name || 'this user'}?`}
            confirmText="Deactivate"
            cancelText="Cancel"
            onConfirm={handleDeactivate}
            onClose={() => setIsDeleteModalOpen(false)}
            type="danger"
          />
        )}
      </div>
    </div>
  );
};

export default CustomerPage;