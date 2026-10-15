import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';

// Pages are loaded on demand so the first load only ships the login screen
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const Categories = lazy(() => import('./pages/Categories'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const CustomerPage = lazy(() => import('./pages/CustomerPage'));
const Settings = lazy(() => import('./pages/Settings'));
const TermsManagement = lazy(() => import('./pages/TermsManagement'));
const PrivacyManagement = lazy(() => import('./pages/PrivacyManagement'));
const DeliveryBoys = lazy(() => import('./pages/DeliveryBoys'));
const DeliveryBoyStats = lazy(() => import('./pages/DeliveryBoyStats'));
const Shipping = lazy(() => import('./pages/Shipping'));
const Returns = lazy(() => import('./pages/Returns'));
const Blogs = lazy(() => import('./pages/Blogs'));
const CreateBlog = lazy(() => import('./pages/CreateBlog'));
const EditBlog = lazy(() => import('./pages/EditBlog'));
const BookingCalendar = lazy(() => import('./pages/BookingCalendar'));
const DeliverySummary = lazy(() => import('./pages/DeliverySummary'));
const Reviews = lazy(() => import('./pages/Reviews'));

// All admin-only pages
const adminRoutes = [
  { path: '/dashboard', Page: Dashboard },
  { path: '/blogs', Page: Blogs },
  { path: '/blogs/create', Page: CreateBlog },
  { path: '/blogs/edit/:id', Page: EditBlog },
  { path: '/delivery-boys/:id/stats', Page: DeliveryBoyStats },
  { path: '/categories', Page: Categories },
  { path: '/products', Page: Products },
  { path: '/orders', Page: OrdersPage },
  { path: '/booking-calendar', Page: BookingCalendar },
  { path: '/delivery-summary', Page: DeliverySummary },
  { path: '/reviews', Page: Reviews },
  { path: '/customers', Page: CustomerPage },
  { path: '/delivery-boys', Page: DeliveryBoys },
  { path: '/terms', Page: TermsManagement },
  { path: '/privacy', Page: PrivacyManagement },
  { path: '/shipping', Page: Shipping },
  { path: '/returns', Page: Returns },
  { path: '/settings', Page: Settings },
];

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />

              {adminRoutes.map(({ path, Page }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <Page />
                    </ProtectedRoute>
                  }
                />
              ))}

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
