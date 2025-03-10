import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";


interface User {
  id: number;
  username: string;
  discord_id?: string;
  avatar?: string;
  email?: string;
  discord_username?: string;
  isAdmin: number;
  // Add other fields as needed from the token payload
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
    // Check for token in URL query params
    const params = new URLSearchParams(window.location.search);
    let token = params.get("token");

    if (token) {
      // Save token to localStorage and remove from URL
      localStorage.setItem("authToken", token);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Otherwise, try to get token from localStorage
      token = localStorage.getItem("authToken");
    }

    if (token) {
      try {
        const decodedUser: User = jwtDecode<User>(token);
        console.log(decodedUser)
        setUser(decodedUser);
      } catch (err) {
        console.error("Token decoding failed:", err);
        setUser(null);
      }
    } else {
      // Fallback: Fetch user from the backend (if no token is found)
      const fetchUser = async () => {
        try {
          const res = await axios.get("http://localhost:5000/api/auth/user", { withCredentials: true });
          setUser(res.data || null);
        } catch (err) {
          setUser(null);
        }
      };

      fetchUser();
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password },
        { withCredentials: true }
      );
      // Optionally, if the response includes a token, decode and set the user:
      const token = res.data.token;
      if (token) {
        localStorage.setItem("authToken", token);
        const decodedUser: User = jwtDecode<User>(token);
        setUser(decodedUser);
      } else {
        setUser(res.data);
      }
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
      localStorage.removeItem("authToken");
      setUser(null);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, discordLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
