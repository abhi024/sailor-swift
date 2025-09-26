import { createContext, useEffect, useState, type ReactNode } from "react";
import { useDisconnect } from "wagmi";
import { type User } from "../types/auth";
import { api } from "../services/client";
import Cookies from "js-cookie";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  googleAuth: (googleToken: string) => Promise<void>;
  walletAuth: (walletAddress: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { disconnectAsync } = useDisconnect();

  const fetchUser = async () => {
    try {
      const userData = await api.auth.getMe();
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.auth.login({ email, password });
    setUser(response.user);
  };

  const signup = async (email: string, password: string) => {
    const response = await api.auth.signup({ email, password });
    setUser(response.user);
  };

  const googleAuth = async (googleToken: string) => {
    const response = await api.auth.googleAuth(googleToken);
    setUser(response.user);
  };

  const walletAuth = async (walletAddress: string) => {
    const response = await api.auth.walletAuth(walletAddress);
    setUser(response.user);
  };


  const logout = async () => {
    try {
      // Disconnect wallet and wait for completion
      await disconnectAsync();

      // Call backend logout
      await api.auth.logout();
    } catch (error) {
      // Even if backend call fails, clear frontend state
      console.error("Logout error:", error);
    } finally {
      // Clear cookies and user state
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      setUser(null);
    }
  };

  const refetchUser = async () => {
    setIsLoading(true);
    await fetchUser();
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    googleAuth,
    walletAuth,
    logout,
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
