import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CatalogPage from './pages/CatalogPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

const Layout = ({ children }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public authentication routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected user routes */}
          <Route
            path="/catalog"
            element={
              <ProtectedRoute>
                <Layout>
                  <CatalogPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Protected admin-only route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Default and catch-all redirects */}
          <Route path="/" element={<Navigate to="/catalog" replace />} />
          <Route path="*" element={<Navigate to="/catalog" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
