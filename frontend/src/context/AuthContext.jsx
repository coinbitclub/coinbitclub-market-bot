import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Para usuários normais
  const [admin, setAdmin] = useState(null);     // Para administradores
  const [loading, setLoading] = useState(true);

  // Lógica: Checa se já tem token salvo (localStorage/sessionStorage)
  useEffect(() => {
    const userToken = localStorage.getItem("user_token");
    const adminToken = localStorage.getItem("admin_token");
    if (userToken) {
      setUser({ token: userToken });
    }
    if (adminToken) {
      setAdmin({ token: adminToken });
    }
    setLoading(false);
  }, []);

  const login = (token, type = "user") => {
    if (type === "admin") {
      setAdmin({ token });
      localStorage.setItem("admin_token", token);
    } else {
      setUser({ token });
      localStorage.setItem("user_token", token);
    }
  };

  const logout = (type = "user") => {
    if (type === "admin") {
      setAdmin(null);
      localStorage.removeItem("admin_token");
    } else {
      setUser(null);
      localStorage.removeItem("user_token");
    }
  };

  return (
    <AuthContext.Provider value={{
      user, admin, loading, login, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
