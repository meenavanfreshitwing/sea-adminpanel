import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { 
  Save, 
  Globe, 
  CreditCard, 
  Code,
  Key,
  X,
  Check,
  Eye,
  AlertCircle,
  LogOut,
  Lock,
  Phone,
  Mail,
  MapPin,
  Link as LinkIcon
} from 'lucide-react';
import { FaSyncAlt } from 'react-icons/fa';
import { settingsAPI } from '../api/settings';

const Settings = () => {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showSecretModalInput, setShowSecretModalInput] = useState(false);

  // Razorpay modal form state
  const [razorpayKeyIdInput, setRazorpayKeyIdInput] = useState('');
  const [razorpayKeySecretInput, setRazorpayKeySecretInput] = useState('');

  const [settings, setSettings] = useState({
    razorpayEnabled: false,
    razorpayKeyId: '',
    razorpayKeySecret: '',
    cashOnDeliveryEnabled: true,
    siteName: '',
    siteTitle: '',
    siteDescription: '',
    contactNumber: '',
    contactEmail: '',
    companyAddress: '',
    whatsappNumber: '',
    fssaiNumber: '',
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    linkedinUrl: '',
    footerText: '',
    footerLinks: [],
    metaKeywords: [],
    googleAnalyticsId: '',
    maintenanceMode: false,
    headerScripts: '',
    bodyScripts: '',
    footerScripts: '',
  });

  const [footerLinks, setFooterLinks] = useState([]);
  const [newFooterLink, setNewFooterLink] = useState({ name: '', url: '' });
  const [metaKeywordInput, setMetaKeywordInput] = useState('');

  // Show notification helper
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 3000);
  };

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Update footerLinks when settings.footerLinks changes
  useEffect(() => {
    if (settings.footerLinks && settings.footerLinks.length > 0) {
      setFooterLinks(settings.footerLinks);
    }
  }, [settings.footerLinks]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getAllSettings();
      
      if (response.data.success) {
        const data = response.data.data;
        setSettings({
          ...settings,
          ...data,
          // Ensure these fields exist
          facebookUrl: data.facebookUrl || '',
          twitterUrl: data.twitterUrl || '',
          instagramUrl: data.instagramUrl || '',
          youtubeUrl: data.youtubeUrl || '',
          linkedinUrl: data.linkedinUrl || '',
        });
        
        if (data.razorpayKeyId) {
          setRazorpayKeyIdInput(data.razorpayKeyId);
        }
        
        if (data.footerLinks && data.footerLinks.length > 0) {
          setFooterLinks(data.footerLinks);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showNotification('error', error.response?.data?.message || error.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle Razorpay toggle
  const handleRazorpayToggle = (enabled) => {
    if (enabled) {
      setShowRazorpayModal(true);
      setRazorpayKeyIdInput(settings.razorpayKeyId || '');
      setRazorpayKeySecretInput(settings.razorpayKeySecret || '');
    } else {
      setSettings(prev => ({
        ...prev,
        razorpayEnabled: false
      }));
    }
  };

  // Save both Razorpay keys from modal
  const saveRazorpayKeys = async () => {
    if (!razorpayKeyIdInput.trim()) {
      showNotification('error', 'Please enter Razorpay Key ID');
      return;
    }
    
    if (!razorpayKeyIdInput.startsWith('rzp_test_') && !razorpayKeyIdInput.startsWith('rzp_live_')) {
      showNotification('error', 'Razorpay Key ID should start with "rzp_test_" or "rzp_live_"');
      return;
    }
    
    try {
      setSaving(true);
      
      const updatedSettings = {
        ...settings,
        razorpayEnabled: true,
        razorpayKeyId: razorpayKeyIdInput.trim(),
        ...(razorpayKeySecretInput.trim() && { razorpayKeySecret: razorpayKeySecretInput.trim() })
      };
      
      const dataToSend = {
        ...updatedSettings,
        footerLinks: footerLinks,
      };

      const response = await settingsAPI.updateSettings(dataToSend);
      
      if (response.data.success) {
        showNotification('success', 'Razorpay keys saved successfully!');
        setShowRazorpayModal(false);
        setRazorpayKeyIdInput('');
        setRazorpayKeySecretInput('');
        setSettings(response.data.data);
        if (response.data.data.footerLinks) {
          setFooterLinks(response.data.data.footerLinks);
        }
      }
    } catch (error) {
      console.error('Error saving Razorpay keys:', error);
      showNotification('error', error.response?.data?.message || error.message || 'Failed to save Razorpay keys');
    } finally {
      setSaving(false);
    }
  };

  // Footer links handlers
  const handleAddFooterLink = () => {
    if (newFooterLink.name.trim() && newFooterLink.url.trim()) {
      const updatedLinks = [...footerLinks, { ...newFooterLink }];
      setFooterLinks(updatedLinks);
      setNewFooterLink({ name: '', url: '' });
    }
  };

  const handleRemoveFooterLink = (index) => {
    const updatedLinks = footerLinks.filter((_, i) => i !== index);
    setFooterLinks(updatedLinks);
  };

  // Meta keywords handlers
  const handleAddMetaKeyword = () => {
    if (metaKeywordInput.trim()) {
      setSettings(prev => ({
        ...prev,
        metaKeywords: [...prev.metaKeywords, metaKeywordInput.trim()]
      }));
      setMetaKeywordInput('');
    }
  };

  const handleRemoveMetaKeyword = (index) => {
    setSettings(prev => ({
      ...prev,
      metaKeywords: prev.metaKeywords.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Prepare data to send - include all fields
      const dataToSend = {
        // General settings
        siteName: settings.siteName,
        siteTitle: settings.siteTitle,
        siteDescription: settings.siteDescription,
        maintenanceMode: settings.maintenanceMode,
        
        // Payment settings
        // Keys from the server .env are not stored here, so don't overwrite the saved ones
        ...(!settings.razorpayFromEnv && {
          razorpayEnabled: settings.razorpayEnabled,
          razorpayKeyId: settings.razorpayKeyId,
          razorpayKeySecret: settings.razorpayKeySecret,
        }),
        cashOnDeliveryEnabled: settings.cashOnDeliveryEnabled,
        
        // Contact info
        contactNumber: settings.contactNumber,
        contactEmail: settings.contactEmail,
        companyAddress: settings.companyAddress,
        whatsappNumber: settings.whatsappNumber,
        fssaiNumber: settings.fssaiNumber,
        
        // Social media (individual fields - backend will map them)
        facebookUrl: settings.facebookUrl,
        twitterUrl: settings.twitterUrl,
        instagramUrl: settings.instagramUrl,
        youtubeUrl: settings.youtubeUrl,
        linkedinUrl: settings.linkedinUrl,
        
        // Footer
        footerText: settings.footerText,
        footerLinks: footerLinks,
        
        // SEO
        metaKeywords: settings.metaKeywords,
        googleAnalyticsId: settings.googleAnalyticsId,
        
        // Scripts
        headerScripts: settings.headerScripts,
        bodyScripts: settings.bodyScripts,
        footerScripts: settings.footerScripts,
      };

      const response = await settingsAPI.updateSettings(dataToSend);
      
      if (response.data.success) {
        showNotification('success', 'Settings saved successfully!');
        setSettings(response.data.data);
        if (response.data.data.footerLinks) {
          setFooterLinks(response.data.data.footerLinks);
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('error', error.response?.data?.message || error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'scripts', label: 'Script Tags', icon: Code },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff0000]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Settings</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 truncate">Configure your store settings and preferences</p>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 sm:px-4 py-2 rounded-lg transition duration-200 flex items-center flex-shrink-0"
              title="Logout"
            >
              <span className="hidden sm:inline mr-2">Logout</span>
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-3 sm:p-4 md:p-6">
          {/* Refresh Button — properly aligned for mobile */}
          <div className="mb-4">
            <button
              onClick={fetchSettings}
              disabled={loading}
              className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-lg transition duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-[42px] sm:float-right"
              title="Refresh settings"
            >
              <FaSyncAlt className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Refreshing...' : ''}</span>
            </button>
            <div className="clear-both"></div>
          </div>

          {/* Notification Banner */}
          {notification.message && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
              notification.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : notification.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-blue-50 border border-blue-200 text-blue-700'
            }`}>
              {notification.message}
            </div>
          )}
          
          {/* Razorpay Configuration Modal */}
          {showRazorpayModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-sm sm:max-w-md overflow-hidden">
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-[#ff0000] to-[#cc0000] rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                        <CreditCard size={16} className="sm:w-5 sm:h-5 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        {settings.razorpayKeyId ? 'Edit Razorpay Keys' : 'Set Razorpay Keys'}
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowRazorpayModal(false)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Key size={14} className="inline mr-1" />
                        Razorpay Key ID
                      </label>
                      <input
                        type="text"
                        value={razorpayKeyIdInput}
                        onChange={(e) => setRazorpayKeyIdInput(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000]"
                        placeholder="rzp_test_XXXXXXXXXXXXX"
                        autoFocus
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Starts with "rzp_test_" or "rzp_live_"
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Lock size={14} className="inline mr-1" />
                        Razorpay Secret Key
                      </label>
                      <div className="relative">
                        <input
                          type={showSecretModalInput ? "text" : "password"}
                          value={razorpayKeySecretInput}
                          onChange={(e) => setRazorpayKeySecretInput(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000] pr-10"
                          placeholder="Enter your Razorpay Secret Key"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecretModalInput(!showSecretModalInput)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        This is a sensitive key. Keep it secure and never share it publicly.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowRazorpayModal(false)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveRazorpayKeys}
                      disabled={saving}
                      className="flex-1 px-3 py-2 text-sm bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white rounded-lg hover:from-[#cc0000] hover:to-[#aa0000] flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          Save Keys
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Settings Content */}
          <div className="max-w-6xl mx-auto">
            {/* Tabs */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden mb-4 sm:mb-6">
              <div className="border-b border-gray-200">
                <div className="flex overflow-x-auto scrollbar-hide px-2 sm:px-0">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                          activeTab === tab.id
                            ? 'text-[#ff0000] border-b-2 border-[#ff0000]'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <Icon size={16} className="mr-2" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="p-4 sm:p-6">
                  {/* General Settings */}
                  {activeTab === 'general' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Information</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Site Name
                            </label>
                            <input
                              type="text"
                              name="siteName"
                              value={settings.siteName}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000]"
                              placeholder="My E-commerce Store"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Site Title
                            </label>
                            <input
                              type="text"
                              name="siteTitle"
                              value={settings.siteTitle}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000]"
                              placeholder="Best Online Shopping Store"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Site Description
                            </label>
                            <textarea
                              name="siteDescription"
                              value={settings.siteDescription}
                              onChange={handleInputChange}
                              rows="2"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000]"
                              placeholder="Your one-stop shop for everything"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900">Maintenance Mode</h3>
                            <p className="text-xs text-gray-500 mt-1">
                              Only admins can access when enabled
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="maintenanceMode"
                              checked={settings.maintenanceMode}
                              onChange={handleInputChange}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-[#ff0000]"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Settings */}
                  {activeTab === 'payment' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                      
                      {/* Razorpay Section */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-[#ff0000] to-[#cc0000] rounded-lg flex items-center justify-center mr-3">
                              <CreditCard size={20} className="text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">Razorpay</h4>
                              <p className="text-xs text-gray-500">Online payment gateway</p>
                            </div>
                          </div>
                          {settings.razorpayFromEnv ? (
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${settings.razorpayEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                              {settings.razorpayEnabled ? 'ON' : 'OFF'}
                            </span>
                          ) : (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="razorpayEnabled"
                              checked={settings.razorpayEnabled}
                              onChange={(e) => handleRazorpayToggle(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-[#ff0000]"></div>
                          </label>
                          )}
                        </div>

                        {settings.razorpayFromEnv && (
                          <div className="bg-white p-3 rounded border border-gray-200 text-xs text-gray-700 space-y-1">
                            <p>
                              Razorpay keys are set in the server <span className="font-mono">.env</span> file
                              (<span className="font-mono">RAZORPAY_KEY_ID</span>, <span className="font-mono">RAZORPAY_KEY_SECRET</span>).
                            </p>
                            <p>
                              Key ID: <span className="font-mono">{settings.razorpayKeyId}</span>
                              {settings.razorpayKeyId?.startsWith('rzp_test_') && (
                                <span className="ml-2 font-semibold text-amber-700">(TEST mode – no real money)</span>
                              )}
                            </p>
                            <p className="text-gray-500">
                              To change the keys or switch online payment off (<span className="font-mono">RAZORPAY_ENABLED=false</span>), edit the server .env and restart the API.
                            </p>
                          </div>
                        )}

                        {settings.razorpayEnabled && !settings.razorpayFromEnv && (
                          <div className="space-y-3">
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center mb-1">
                                    <Key size={14} className="text-gray-700 mr-1" />
                                    <span className="text-xs font-medium text-gray-700">Razorpay Key ID</span>
                                  </div>
                                  <p className="text-xs text-gray-900 font-mono truncate">
                                    {settings.razorpayKeyId || 'Not set'}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRazorpayKeyIdInput(settings.razorpayKeyId || '');
                                    setRazorpayKeySecretInput(settings.razorpayKeySecret || '');
                                    setShowRazorpayModal(true);
                                  }}
                                  className="text-[#ff0000] hover:text-[#cc0000] text-xs ml-2 px-2 py-1"
                                >
                                  {settings.razorpayKeyId ? 'Edit' : 'Set'}
                                </button>
                              </div>
                            </div>
                            
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center mb-1">
                                    <Lock size={14} className="text-gray-700 mr-1" />
                                    <span className="text-xs font-medium text-gray-700">Razorpay Secret Key</span>
                                  </div>
                                  <p className="text-xs text-gray-900 font-mono truncate flex items-center">
                                    <span className="mr-2">
                                      {settings.razorpayKeySecret 
                                        ? (showSecret ? settings.razorpayKeySecret : '••••••••••••••••••••••') 
                                        : 'Not set'}
                                    </span>
                                    {settings.razorpayKeySecret && (
                                      <button
                                        type="button"
                                        onClick={() => setShowSecret(!showSecret)}
                                        className="text-gray-500 hover:text-gray-700"
                                      >
                                        <Eye size={14} />
                                      </button>
                                    )}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRazorpayKeyIdInput(settings.razorpayKeyId || '');
                                    setRazorpayKeySecretInput(settings.razorpayKeySecret || '');
                                    setShowRazorpayModal(true);
                                  }}
                                  className="text-[#ff0000] hover:text-[#cc0000] text-xs ml-2 px-2 py-1"
                                >
                                  Edit
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Cash on Delivery Section */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                              <CreditCard size={20} className="text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">Cash on Delivery</h4>
                              <p className="text-xs text-gray-500">Pay when you receive</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="cashOnDeliveryEnabled"
                              checked={settings.cashOnDeliveryEnabled}
                              onChange={handleInputChange}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-[#ff0000]"></div>
                          </label>
                        </div>
                      </div>

                      {/* Contact Info Section */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                            <Phone size={20} className="text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Contact Information</h4>
                            <p className="text-xs text-gray-500">Business contact details</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              <Phone size={14} className="inline mr-1" />
                              Contact Number
                            </label>
                            <input
                              type="tel"
                              name="contactNumber"
                              value={settings.contactNumber}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000]"
                              placeholder="+91 1234567890"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              <Mail size={14} className="inline mr-1" />
                              Contact Email
                            </label>
                            <input
                              type="email"
                              name="contactEmail"
                              value={settings.contactEmail}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000]"
                              placeholder="contact@example.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              <MapPin size={14} className="inline mr-1" />
                              Company Address
                            </label>
                            <textarea
                              name="companyAddress"
                              value={settings.companyAddress}
                              onChange={handleInputChange}
                              rows="2"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000]"
                              placeholder="123 Street, City, Country"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              <Phone size={14} className="inline mr-1" />
                              WhatsApp Number
                            </label>
                            <input
                              type="tel"
                              name="whatsappNumber"
                              value={settings.whatsappNumber || ''}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000]"
                              placeholder="+91 98765 43210"
                            />
                            <p className="mt-1 text-xs text-gray-500">Shows a "Chat on WhatsApp" button on the website. Leave empty to hide it.</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              FSSAI Licence Number
                            </label>
                            <input
                              type="text"
                              name="fssaiNumber"
                              value={settings.fssaiNumber || ''}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000]"
                              placeholder="14-digit FSSAI number"
                            />
                            <p className="mt-1 text-xs text-gray-500">Shown in the website footer to build customer trust.</p>
                          </div>
                        </div>
                      </div>

                      {/* Social Media Section */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                            <LinkIcon size={20} className="text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Social Media Links</h4>
                            <p className="text-xs text-gray-500">Connect with customers</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                              Facebook
                            </label>
                            <input
                              type="url"
                              name="facebookUrl"
                              value={settings.facebookUrl}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000]"
                              placeholder="https://facebook.com/yourpage"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                              Instagram
                            </label>
                            <input
                              type="url"
                              name="instagramUrl"
                              value={settings.instagramUrl}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000]"
                              placeholder="https://instagram.com/yourprofile"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                              Twitter
                            </label>
                            <input
                              type="url"
                              name="twitterUrl"
                              value={settings.twitterUrl}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000]"
                              placeholder="https://twitter.com/yourprofile"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                              YouTube
                            </label>
                            <input
                              type="url"
                              name="youtubeUrl"
                              value={settings.youtubeUrl}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000]"
                              placeholder="https://youtube.com/yourchannel"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                              LinkedIn
                            </label>
                            <input
                              type="url"
                              name="linkedinUrl"
                              value={settings.linkedinUrl}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000]"
                              placeholder="https://linkedin.com/company/yourpage"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Script Tags Settings */}
                  {activeTab === 'scripts' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Script Tags Management</h3>
                      
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                              <strong>Important:</strong> These scripts will be injected directly into your website. 
                              Only add scripts from trusted sources. Incorrect scripts can break your site.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Header Scripts */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Code className="text-blue-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Header Scripts</h4>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Scripts to add in &lt;head&gt; section
                          </label>
                          <div className="text-xs text-gray-500 mb-2">
                            (e.g., Google Analytics, Facebook Pixel, meta tags, etc.)
                          </div>
                          <textarea
                            name="headerScripts"
                            value={settings.headerScripts}
                            onChange={handleInputChange}
                            rows="6"
                            className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000]"
                            placeholder='<!-- Add header scripts here -->'
                          />
                        </div>
                      </div>

                      {/* Body Scripts */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Code className="text-green-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Body Scripts</h4>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Scripts to add after opening &lt;body&gt; tag
                          </label>
                          <div className="text-xs text-gray-500 mb-2">
                            (e.g., Chat widgets, tracking scripts, etc.)
                          </div>
                          <textarea
                            name="bodyScripts"
                            value={settings.bodyScripts}
                            onChange={handleInputChange}
                            rows="6"
                            className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000]"
                            placeholder='<!-- Add body scripts here -->'
                          />
                        </div>
                      </div>

                      {/* Footer Scripts */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Code className="text-purple-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Footer Scripts</h4>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Scripts to add before closing &lt;/body&gt; tag
                          </label>
                          <div className="text-xs text-gray-500 mb-2">
                            (e.g., Analytics, chat widgets, performance tracking, etc.)
                          </div>
                          <textarea
                            name="footerScripts"
                            value={settings.footerScripts}
                            onChange={handleInputChange}
                            rows="6"
                            className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff0000] focus:border-[#ff0000]"
                            placeholder='<!-- Add footer scripts here -->'
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div className="border-t border-gray-200 p-4 sm:p-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white font-medium rounded-lg hover:from-[#cc0000] hover:to-[#aa0000] transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="sm:w-5 sm:h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;