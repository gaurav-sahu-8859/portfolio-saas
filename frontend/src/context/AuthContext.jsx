import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  const setAuth = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await authAPI.me();
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        setUser({ ...data, token: stored.token });
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    setAuth(data);
    toast.success(`Welcome back, ${data.name}!`);
    return data;
  }, []);

  const register = useCallback(async (name, username, email, password) => {
    const { data } = await authAPI.register({ name, username, email, password });
    setAuth(data);
    toast.success('Account created! Welcome aboard 🎉');
    return data;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    toast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Re-pulls the full user doc from the server — used after a successful
  // upgrade/downgrade so the rest of the app (theme locks, billing UI)
  // reflects the new plan without requiring a full page reload.
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authAPI.me();
      updateUser(data);
      return data;
    } catch {
      return null;
    }
  }, [updateUser]);

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, updateUser, refreshUser,
      // isAdmin means "admin-tier" (admin OR super_admin) — broadened on
      // purpose so every existing check that gates admin-only UI/routes
      // (ThemeSwitcherBar, DashboardLayout, App.js's adminOnly guard)
      // automatically also lets super_admin through, with zero changes
      // needed at those call sites.
      isAdmin: ['admin', 'super_admin'].includes(user?.role),
      // New, more granular flags for the new role tiers.
      isSuperAdmin: user?.role === 'super_admin',
      isFamilyAdmin: user?.role === 'family_admin',
      // Prefer the backend-computed entitlement (covers admin bypass +
      // Stripe plan + family grant in one flag) once it's present on the
      // user object; fall back to the old plan-only check before the
      // first /api/auth/me refresh populates it, so nothing flashes
      // "locked" for a frame on initial load.
      isPro: user?.entitlement ?? (user?.plan === 'pro'),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
