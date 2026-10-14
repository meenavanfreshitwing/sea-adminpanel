// App.jsx (or your main routing component)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import OrdersPage from './pages/OrdersPage';
import CustomerPage from './pages/CustomerPage';
import Settings from './pages/Settings';
import TermsManagement from './pages/TermsManagement';
import DeliveryBoyStats from './pages/DeliveryBoyStats';
import PrivacyManagement from './pages/PrivacyManagement';
import DeliveryBoys from './pages/DeliveryBoys';
import Shipping from './pages/Shipping';   // ✅ ADD THIS
import Returns from './pages/Returns';     // ✅ ADD THIS

// Import Blog pages
import Blogs from './pages/Blogs';
import CreateBlog from './pages/CreateBlog';
import EditBlog from './pages/EditBlog';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Blog Routes */}
            <Route
              path="/blogs"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Blogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/blogs/create"
              element={
                <ProtectedRoute adminOnly={true}>
                  <CreateBlog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/blogs/edit/:id"
              element={
                <ProtectedRoute adminOnly={true}>
                  <EditBlog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/delivery-boys/:id/stats"
              element={
                <ProtectedRoute adminOnly={true}>
                  <DeliveryBoyStats />
                </ProtectedRoute>
              }
            />

            {/* Categories */}
            <Route
              path="/categories"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Categories />
                </ProtectedRoute>
              }
            />

            {/* Products */}
            <Route
              path="/products"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Products />
                </ProtectedRoute>
              }
            />

            {/* Orders */}
            <Route
              path="/orders"
              element={
                <ProtectedRoute adminOnly={true}>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />

            {/* Customers */}
            <Route
              path="/customers"
              element={
                <ProtectedRoute adminOnly={true}>
                  <CustomerPage />
                </ProtectedRoute>
              }
            />

            {/* Delivery Boys */}
            <Route
              path="/delivery-boys"
              element={
                <ProtectedRoute adminOnly={true}>
                  <DeliveryBoys />
                </ProtectedRoute>
              }
            />

            {/* Terms Management */}
            <Route
              path="/terms"
              element={
                <ProtectedRoute adminOnly={true}>
                  <TermsManagement />
                </ProtectedRoute>
              }
            />

            {/* Privacy Management */}
            <Route
              path="/privacy"
              element={
                <ProtectedRoute adminOnly={true}>
                  <PrivacyManagement />
                </ProtectedRoute>
              }
            />

            {/* ✅ Shipping Management */}
            <Route
              path="/shipping"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Shipping />
                </ProtectedRoute>
              }
            />

            {/* ✅ Returns Management */}
            <Route
              path="/returns"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Returns />
                </ProtectedRoute>
              }
            />

            {/* Settings */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;