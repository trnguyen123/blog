import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = authService.getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);
      setUser(result.user);
      setIsAuthenticated(true);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const register = async (data) => {
    try {
      const result = await authService.register(data);
      setUser(result.user);
      setIsAuthenticated(true);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
  };
}
