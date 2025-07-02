import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setErro("");
    try {
      // Troque o endpoint conforme sua API
      const res = await api.post("/api/auth/login", { email, senha });
      login(res.data.user);
      navigate("/user/dashboard");
    } catch (err) {
      setErro("Usuário ou senha inválidos");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleLogin} className="bg-card rounded-2xl shadow-xl p-8 w-full max-w-sm flex flex-col gap-5 border border-border">
        <h1 className="text-2xl font-bold text-cyan-400 mb-3">CoinbitClub Login</h1>
        <input
          type="email"
          placeholder="E-mail"
          className="p-3 rounded bg-background border border-border focus:outline-none"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          className="p-3 rounded bg-background border border-border focus:outline-none"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          required
        />
        {erro && <div className="text-red-400 text-sm">{erro}</div>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
