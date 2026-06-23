'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  apiUrl: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    // Check localStorage on mount
    const storedToken = localStorage.getItem('travel_planner_token');
    const storedUser = localStorage.getItem('travel_planner_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // Clear corrupt storage
        localStorage.removeItem('travel_planner_token');
        localStorage.removeItem('travel_planner_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to login' };
      }

      localStorage.setItem('travel_planner_token', data.token);
      localStorage.setItem('travel_planner_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      
      router.push('/dashboard');
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Cannot connect to backend server. Please verify backend is running.' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to register' };
      }

      localStorage.setItem('travel_planner_token', data.token);
      localStorage.setItem('travel_planner_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);

      router.push('/dashboard');
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Cannot connect to backend server. Please verify backend is running.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('travel_planner_token');
    localStorage.removeItem('travel_planner_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        apiUrl
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
