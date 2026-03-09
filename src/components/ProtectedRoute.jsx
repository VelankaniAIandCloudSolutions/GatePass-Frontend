import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const location = useLocation();

    let user = null;
    try {
        if (userStr && userStr !== 'undefined') {
            user = JSON.parse(userStr);
        }
    } catch (err) {
        console.error('ProtectedRoute: User parse error', err);
    }

    if (!token || !user) {
        // Not logged in or invalid session
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && (!user.role || !allowedRoles.includes(user.role))) {
        // Role not allowed - redirect to their own dashboard or login
        const fallbackPath = user.role ? `/${user.role}-dashboard` : '/login';
        return <Navigate to={fallbackPath} replace />;
    }

    return children;
};

export default ProtectedRoute;
