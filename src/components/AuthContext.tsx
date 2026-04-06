import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile } from "../types";
import { MOCK_USER, MOCK_PROFILE } from "../mockData";

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const savedUser = localStorage.getItem("mock_user");
      if (savedUser) {
        setUser(MOCK_USER);
        setProfile(MOCK_PROFILE);
      }
      setLoading(false);
    }, 500);
  }, []);

  const login = async (email: string, typedPassword?: string) => {
    setError(null);
    setLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (email && typedPassword) {
      setUser(MOCK_USER);
      setProfile(MOCK_PROFILE);
      localStorage.setItem("mock_user", "true");
    } else {
      setError("Por favor, preencha e-mail e senha.");
    }
    setLoading(false);
  };

  const logout = async () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem("mock_user");
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
