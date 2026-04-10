import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ children, allowedRole }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>; // You can style this later
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && currentUser.role !== allowedRole) {
    // Redirect to the correct dashboard based on role
    return <Navigate to={currentUser.role === 'admin' ? '/admin-dashboard' : '/user-dashboard'} replace />;
  }

  return children;
}
