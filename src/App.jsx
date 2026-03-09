import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login/LoginPage';
import DashboardSkeleton from './pages/Dashboards/DashboardSkeleton';
import ProtectedRoute from './components/ProtectedRoute';
import Logout from './components/Logout';
import CreateMaterialPass from './pages/User/CreateMaterialPass';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
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
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
