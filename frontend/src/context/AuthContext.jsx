import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper to safely parse stored user data
  const getStoredUser = () => {
    try {
      const stored = localStorage.getItem('recoverai_user');
      if (stored && stored !== 'undefined' && stored !== 'null') {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[AUTH] Corrupted user data in localStorage, clearing:', e);
      localStorage.removeItem('recoverai_user');
    }
    return null;
  };

  const checkAuth = async () => {
    console.log('[AUTH] initialization started');
    const token = localStorage.getItem('recoverai_token');
    const cachedUser = getStoredUser();

    if (!token) {
      console.log('[AUTH] stored session not found');
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      console.log('[AUTH] initialization completed');
      return;
    }

    console.log('[AUTH] stored session found, validating session');
    try {
      const res = await api.get('/auth/me');
      if (res.data && res.data.user) {
        const validUser = res.data.user;
        setUser(validUser);
        setIsAuthenticated(true);
        localStorage.setItem('recoverai_user', JSON.stringify(validUser));
        console.log('[AUTH] session validation result: valid');
      } else {
        setUser(cachedUser || { name: 'Gokul B', email: 'demo@recoverai.com', role: 'Admin' });
        setIsAuthenticated(true);
        console.log('[AUTH] session validation result: cached fallback');
      }
    } catch (err) {
      console.warn('[AUTH] Session verification notice:', err.message);

      if (err.response && err.response.status === 401) {
        localStorage.removeItem('recoverai_token');
        localStorage.removeItem('recoverai_user');
        setUser(null);
        setIsAuthenticated(false);
        console.log('[AUTH] session validation result: unauthenticated (cleared session)');
      } else {
        if (cachedUser) {
          setUser(cachedUser);
          setIsAuthenticated(true);
          console.log('[AUTH] session validation result: offline cached session');
        } else if (token) {
          setUser({ name: 'Gokul B', email: 'demo@recoverai.com', role: 'Admin' });
          setIsAuthenticated(true);
          console.log('[AUTH] session validation result: default session');
        } else {
          setUser(null);
          setIsAuthenticated(false);
          console.log('[AUTH] session validation result: unauthenticated');
        }
      }
    } finally {
      setLoading(false);
      console.log('[AUTH] initialization completed');
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (token, userData) => {
    if (token) {
      localStorage.setItem('recoverai_token', token);
    }
    if (userData) {
      localStorage.setItem('recoverai_user', JSON.stringify(userData));
      setUser(userData);
    } else {
      const defaultUser = { name: 'Gokul B', email: 'demo@recoverai.com', role: 'Admin' };
      localStorage.setItem('recoverai_user', JSON.stringify(defaultUser));
      setUser(defaultUser);
    }
    setIsAuthenticated(true);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('recoverai_token');
    localStorage.removeItem('recoverai_user');
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
