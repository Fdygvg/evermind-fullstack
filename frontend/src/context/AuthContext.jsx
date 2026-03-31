import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { AuthContext } from './AuthContextInstance';

export const AuthProvider = ({ children }) => {
  // Initialize from localStorage cache immediately — no loading spinner on return visits
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('evermind_user');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(() => {
    // Only show loading if there's no cached user (first visit / logged out)
    return !localStorage.getItem('evermind_user');
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('evermind_token');
      if (token) {
        // Background verify — user is already set from cache, this just confirms token is still valid
        const response = await authService.getProfile();
        setUser(response.data.data.user);
        // Update cache with fresh data
        localStorage.setItem('evermind_user', JSON.stringify(response.data.data.user));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error(error); 
      localStorage.removeItem('evermind_token');
      localStorage.removeItem('evermind_user');
      setUser(null);
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