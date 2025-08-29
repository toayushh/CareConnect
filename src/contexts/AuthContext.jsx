import React, { createContext, useContext, useState, useEffect } from 'react';
import { useApi } from './ApiContext';

const AuthContext = createContext();

const buildAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=3b82f6&color=fff`;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { 
    user: apiUser, 
    userType: apiUserType, 
    isLoading: apiLoading, 
    login: apiLogin, 
    register: apiRegister, 
    logout: apiLogout 
  } = useApi();
  
  
  
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'patient' or 'doctor'
  const [loading, setLoading] = useState(true);

  // Check if JWT token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  };

  // Clear expired tokens and redirect to login
  const clearExpiredTokens = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setUserType(null);
    // Redirect to login page
    window.location.href = '/#login';
  };

  useEffect(() => {
    // Check for expired tokens on mount
    const token = localStorage.getItem('authToken');
    if (token && isTokenExpired(token)) {
      console.log('JWT token expired, clearing authentication');
      clearExpiredTokens();
      return;
    }

    // Sync with API context
    if (apiUser) {
      const clientUser = {
        id: apiUser.id,
        email: apiUser.email,
        name: apiUser.name || apiUser.full_name,
        type: apiUser.role || apiUser.type,
        avatar: buildAvatar(apiUser.name || apiUser.full_name),
      };
      setUser(clientUser);
      setUserType(apiUser.role || apiUser.type);
    } else {
      setUser(null);
      setUserType(null);
    }
    
    setLoading(apiLoading);
  }, [apiUser, apiUserType, apiLoading]);

  const login = async (email, password, type) => {
    try {
      const response = await apiLogin({ email, password, user_type: type });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData, type) => {
    try {
      await apiRegister(userData, type);
      
      // Auto-login after successful registration
      return await login(userData.email, userData.password, type);
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    setUserType(null);
    // Clear all tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  };

  // Add the missing fetchWithAuth function
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('authToken');
    
    // Check if token is expired before making request
    if (token && isTokenExpired(token)) {
      console.log('Token expired during request, clearing authentication');
      clearExpiredTokens();
      throw new Error('Token expired - Please login again');
    }
    
    // Prepend backend base URL if it's a relative URL
    const baseUrl = 'http://localhost:9000';
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(fullUrl, config);
      
      if (response.status === 401) {
        // Token expired or invalid, clear it
        console.log('Received 401, clearing expired tokens');
        clearExpiredTokens();
        throw new Error('Unauthorized - Please login again');
      }

      return response;
    } catch (error) {
      console.error('fetchWithAuth error:', error);
      throw error;
    }
  };

  const value = {
    user,
    userType,
    login,
    register,
    logout,
    loading,
    fetchWithAuth,
    clearExpiredTokens,
    isTokenExpired,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};