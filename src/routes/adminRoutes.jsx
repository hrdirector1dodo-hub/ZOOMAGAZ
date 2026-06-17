// src/routes/adminRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Login from '../components/admin/Login';
import AdminProductsList from '../components/admin/AdminProductsList';
import ProductForm from '../components/admin/ProductForm';
import Promotions from '../components/admin/Promotions';
import Orders from '../components/admin/Orders';
import Reviews from '../components/admin/Reviews';
import Articles from '../components/admin/Articles';
import Dashboard from '../components/admin/Dashboard';
import { useAdminAuth } from '../hooks/useAdminAuth';

// Wrapper component to protect admin routes
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAdminAuth();
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

const AdminRoutes = () => {
  return (
    <Routes>
      {/* Public login route */}
      <Route path="login" element={<Login />} />

      {/* Protected admin area */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<AdminProductsList />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="promotions" element={<Promotions />} />
        <Route path="articles" element={<Articles />} />
        <Route path="orders" element={<Orders />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
