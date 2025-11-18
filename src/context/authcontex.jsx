import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('site_token'));
  const [user, setUser] = useState(() => {
    try {
        const storedUser = localStorage.getItem('site_user');
        return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
        console.error("Could not parse user from localStorage", e);
        return null;
    }
  });

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('site_token', newToken);
    localStorage.setItem('site_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('site_token');
    localStorage.removeItem('site_user');
  };

  const value = {
    token,
    user,
    login,
    logout,
    isAuthenticated: !!token, 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};