import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import App from './App.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'
import ShopDashboard from './components/ShopDashboard.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          {/* Public Landing & Tree Route */}
          <Route path="/" element={<App />} />

          {/* User Dashboard Route */}
          <Route
            path="/user-dashboard"
            element={
              <ProtectedRoute allowedRole="user">
                <App initialPage="my-dashboard" />
              </ProtectedRoute>
            }
          />

          {/* Shop Partner Dashboard */}
          <Route
            path="/shop-dashboard"
            element={
              <ProtectedRoute allowedRole="shop">
                <ShopDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Dashboard */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
