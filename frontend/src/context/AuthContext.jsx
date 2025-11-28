import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { AuthContext } from './AuthContextInstance';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('evermind_token');
      if (token) {
        const response = await authService.getProfile();
        setUser(response.data.data.user);
      }
    } catch (error) {
          console.error(error); 
      localStorage.removeItem('evermind_token');
      localStorage.removeItem('evermind_user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    const { user, token } = response.data.data;
    
    localStorage.setItem('evermind_token', token);
    localStorage.setItem('evermind_user', JSON.stringify(user));
    setUser(user);
    
    return response;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    const { user, token } = response.data.data;
    
    localStorage.setItem('evermind_token', token);
    localStorage.setItem('evermind_user', JSON.stringify(user));
    setUser(user);
    
    return response;
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem('evermind_token');
    localStorage.removeItem('evermind_user');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};