import { createContext, useContext, useState, useEffect } from "react";

// Exemplo de uso com token localStorage (ajuste conforme sua API)
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);    // { id, name, email, role }
  const [loading, setLoading] = useState(true);

  // Executado ao iniciar o app (verifica token salvo)
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      // Você pode criar um endpoint /me ou /profile no backend
      fetch(`${import.meta.env.VITE_API_URL}/user/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.id) setUser(data);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Função para login
  async function login(email, password) {
    setLoading(true);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem("authToken", data.token);
      setUser(data.user); // data.user = { id, name, email, role }
      setLoading(false);
      return { success: true };
    } else {
      setLoading(false);
      return { success: false, message: data.message || "Erro no login" };
    }
  }

  // Função para logout
  function logout() {
    localStorage.removeItem("authToken");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
