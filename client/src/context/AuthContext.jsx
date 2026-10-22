import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('scp_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initSession() {
      const storedToken = localStorage.getItem('scp_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            setToken(storedToken);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Existing session invalid or expired, re-authenticating default admin...', err.message);
        }
      }

      // If no valid session exists or token expired, auto-authenticate with backend
      try {
        const loginRes = await api.login('admin@supplychainpro.com', 'admin123');
        if (loginRes.success && loginRes.token) {
          localStorage.setItem('scp_token', loginRes.token);
          setToken(loginRes.token);
          setUser(loginRes.user);
        } else {
          fallbackLocalAdmin();
        }
      } catch (err) {
        console.warn('Backend login connection deferred, using offline admin profile:', err.message);
        fallbackLocalAdmin();
      } finally {
        setLoading(false);
      }
    }

    function fallbackLocalAdmin() {
      setUser({
        id: 1,
        name: 'Sabarivasan M',
        email: 'admin@supplychainpro.com',
        role: 'admin',
        department: 'Global Operations & Supply Chain'
      });
    }

    initSession();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      if (res.success) {
        localStorage.setItem('scp_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('scp_token');
    setToken(null);
    setUser(null);
  };

  const switchDemoRole = async (role) => {
    if (role === 'admin') {
      await login('admin@supplychainpro.com', 'admin123');
    } else {
      await login('staff@supplychainpro.com', 'staff123');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        switchDemoRole,
        isAdmin: user?.role === 'admin',
        isStaff: user?.role === 'staff',
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
