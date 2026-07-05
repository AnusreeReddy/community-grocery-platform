import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api.js";
import { loginUser, registerUser } from "../services/authService.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("community-user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("community-token") || "");
  const [loading, setLoading] = useState(false);

  const persistSession = (tokenValue, userData) => {
    localStorage.setItem("community-token", tokenValue);
    localStorage.setItem("community-user", JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  };

  const login = async (credentials) => {
    const response = await loginUser(credentials);
    persistSession(response.token, response.user);
    return response.user;
  };

  const register = async (data) => {
    const response = await registerUser(data);
    return response.user;
  };

  const logout = () => {
    localStorage.removeItem("community-token");
    localStorage.removeItem("community-user");
    setToken("");
    setUser(null);
  };

  useEffect(() => {
    if (token && !user) {
      setLoading(true);
      api.get("/auth/me")
        .then((resp) => {
          setUser(resp.data.user);
          localStorage.setItem("community-user", JSON.stringify(resp.data.user));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
