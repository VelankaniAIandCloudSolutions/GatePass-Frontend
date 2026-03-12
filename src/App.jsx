import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login/LoginPage';
import DashboardSkeleton from './pages/Dashboards/DashboardSkeleton';
import ProtectedRoute from './components/ProtectedRoute';
import Logout from './components/Logout';
import CreateMaterialPass from './pages/User/CreateMaterialPass';

// Smart Redirect Component for the base URL and catch-all routes
const SmartRedirect = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
      if (user.role === 'manager') return <Navigate to="/manager-dashboard" replace />;
      if (user.role === 'security') return <Navigate to="/security-dashboard" replace />;
      if (user.role === 'user') return <Navigate to="/user-dashboard" replace />;
    } catch (e) {
      console.error('Invalid user data in localStorage');
    }
  }
  
  return <Navigate to="/login" replace />;
};

// Auth Guard specifically for the login page
const AuthGuard = ({ children }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      // User is already logged in, redirect them away from login page
      return <SmartRedirect />;
    } catch (e) {
      // Invalid token/user, allow them to see the login page
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
  
  return children;
};


function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <AuthGuard>
              <LoginPage />
            </AuthGuard>
          } 
        />
        <Route path="/logout" element={<Logout />} />

        {/* User Routes */}
        <Route 
          path="/user-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <DashboardSkeleton role="user" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-material-pass" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <CreateMaterialPass />
            </ProtectedRoute>
          } 
        />

        {/* Manager Dashboard */}
        <Route 
          path="/manager-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <DashboardSkeleton role="manager" />
            </ProtectedRoute>
          } 
        />

        {/* Security Dashboard */}
        <Route 
          path="/security-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['security']}>
              <DashboardSkeleton role="security" />
            </ProtectedRoute>
          } 
        />

        {/* Admin Dashboard */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardSkeleton role="admin" />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/track" 
          element={
            <ProtectedRoute allowedRoles={['user', 'manager', 'security', 'admin']}>
              <DashboardSkeleton initialTab="track" />
            </ProtectedRoute>
          } 
        />

        {/* Default Redirect */}
        <Route path="/" element={<SmartRedirect />} />
        <Route path="*" element={<SmartRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;
