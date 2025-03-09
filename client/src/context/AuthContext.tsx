import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

interface User {
  id: number;
  username: string;
  discord_id?: string;
  avatar?: string;
  email?: string;
  discord_username?: string;
  isAdmin: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  discordLogin: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/user", { withCredentials: true });
        setUser(res.data || null);
      } catch (err) {
        setUser(null);
      }
    };

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("authToken", token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", { email, password }, { withCredentials: true });
      setUser(res.data);
      return true;
    } catch (err) {
      return false;
    }
  };

  const discordLogin = () => {
    window.location.href = "http://localhost:5000/auth/discord";
  };

  const logout = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
      setUser(null);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return <AuthContext.Provider value={{ user, login, discordLogin, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
