import React, { createContext, useState, useContext, useEffect } from 'react';
import { useGetAdminUserByEmailQuery, useLazyGetAdminUserByEmailQuery } from '../store/slices/authApi';
import { skipToken } from '@reduxjs/toolkit/query';

type AuthContextType = {
  isLoggedIn: boolean;
  email: string | null;
  login: (email: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [getAdminUserByEmail, { data: userData, isLoading: loadingUser }] = useLazyGetAdminUserByEmailQuery(); // 🔄 Lazy query


  useEffect(() => {
    const storedEmail = localStorage.getItem('email');
    if (storedEmail) {
      login(storedEmail); // Restore session on app start
    }
  }, []);
  

  const login = async (email: string) => {
    try {
      const res = await getAdminUserByEmail(email)
      console.log('admin', res)
      setIsLoggedIn(true);
      localStorage.setItem('email', email)
      setEmail(email);
    } catch (err) {
      console.log('erroronLogin', err)
    }

  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('email')
    setEmail(null);
  };


  return (
    <AuthContext.Provider value={{ isLoggedIn, email, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}; 