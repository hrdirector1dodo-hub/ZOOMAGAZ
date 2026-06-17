// src/hooks/useAdminAuth.js
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook that provides simple admin authentication based on a flag stored in
 * localStorage. In a production setup you should replace this with Supabase
 * Auth + RLS policies.
 */
export const useAdminAuth = () => {
  const navigate = useNavigate();

  const isAuthenticated = !!localStorage.getItem('adminAuth');

  const login = useCallback(() => {
    localStorage.setItem('adminAuth', 'true');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('adminAuth');
    navigate('/admin/login', { replace: true });
  }, [navigate]);

  return { isAuthenticated, login, logout };
};

/**
 * Helper used by route guards.
 */
export const redirectIfUnauthenticated = (navigate) => {
  if (!localStorage.getItem('adminAuth')) {
    navigate('/admin/login', { replace: true });
  }
};
