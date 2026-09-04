import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ children, allowedRole }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #b8deff 0%, #d0efb8 50%, #8ec850 100%)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: '#1b3d16',
        fontSize: '1.2rem',
        fontWeight: 600
      }}>
        Loading Still With You...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && currentUser.role !== allowedRole) {
    const roleRoutes = {
      admin: '/admin-dashboard',
      shop: '/shop-dashboard',
      user: '/user-dashboard'
    };
    return <Navigate to={roleRoutes[currentUser.role] || '/'} replace />;
  }

  return children;
}
