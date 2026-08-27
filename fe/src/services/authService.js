const API_BASE_URL = 'http://localhost:8000/api';

export const authService = {
  // Register user
  register: async (data) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Registration failed');
    }

    // Store token and user data
    if (result.data?.token) {
      localStorage.setItem('accessToken', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }

    return result.data;
  },

  // Login user
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Login failed');
    }

    // Store token and user data
    if (result.data?.token) {
      localStorage.setItem('accessToken', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }

    return result.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to get user');
    }

    return result.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('accessToken');
  },

  // Get stored user
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },
};
