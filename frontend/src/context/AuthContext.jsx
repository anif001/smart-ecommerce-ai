import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await API.get('/api/auth/profile');
          setUser(res.data);
        } catch (err) {
          console.error("Auth initialization failed:", err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/api/auth/login', { email, password });
      const { token, id, name, role } = res.data;
      localStorage.setItem('token', token);
      const userProfile = { id, name, email, role };
      localStorage.setItem('user', JSON.stringify(userProfile));
      setUser(userProfile);
      setLoading(false);
      return userProfile;
    } catch (err) {
      setError(err.response?.data || 'Login failed');
      setLoading(false);
      throw err;
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/api/auth/register', { name, email, password });
      setLoading(false);
      return res.data;
    } catch (err) {
      setError(err.response?.data || 'Registration failed');
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, isAdmin: user?.role === 'ROLE_ADMIN' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
