import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true); // true while checking stored session

  // ── On mount: restore session from localStorage ───────────────
  useEffect(() => {
    const storedToken = localStorage.getItem('pyro_token');
    const storedUser  = localStorage.getItem('pyro_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('pyro_user');
      }
      // Verify token is still valid by fetching fresh user data
      userAPI.getMe()
        .then(({ data }) => {
          setUser(data.user);
          localStorage.setItem('pyro_user', JSON.stringify(data.user));
        })
        .catch(() => {
          // Token invalid — clear everything
          localStorage.removeItem('pyro_token');
          localStorage.removeItem('pyro_user');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ── Register ──────────────────────────────────────────────────
  const register = useCallback(async ({ name, email, password }) => {
    const { data } = await authAPI.register({ name, email, password });
    localStorage.setItem('pyro_token', data.token);
    localStorage.setItem('pyro_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  // ── Login ─────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('pyro_token', data.token);
    localStorage.setItem('pyro_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  // ── Logout ────────────────────────────────────────────────────
  const logout = useCallback(() => {
    authAPI.logout().catch(() => {});
    localStorage.removeItem('pyro_token');
    localStorage.removeItem('pyro_user');
    setToken(null);
    setUser(null);
  }, []);

  // ── Update user in context (after avatar/profile changes) ─────
  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedFields };
      localStorage.setItem('pyro_user', JSON.stringify(next));
      return next;
    });
  }, []);

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
