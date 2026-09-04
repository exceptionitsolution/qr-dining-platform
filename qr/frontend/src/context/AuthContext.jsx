import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('zaika_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('zaika_admin_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setAdminUser(res.data);
          localStorage.setItem('zaika_admin_user', JSON.stringify(res.data));
        } catch {
          // Token expired or invalid
          logout();
        }
      }
      setIsLoading(false);
    };

    verifySession();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user } = res.data;
    setToken(newToken);
    setAdminUser(user);
    localStorage.setItem('zaika_admin_token', newToken);
    localStorage.setItem('zaika_admin_user', JSON.stringify(user));
    return user;
  };

  const logout = () => {
    setToken(null);
    setAdminUser(null);
    localStorage.removeItem('zaika_admin_token');
    localStorage.removeItem('zaika_admin_user');
  };

  return (
    <AuthContext.Provider
      value={{
        adminUser,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
