// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const res = await login(email, password);
    if (res.success) {
      const from = location.state?.from?.pathname || "/user/dashboard";
      navigate(from, { replace: true });
    } else {
      setError(res.message || "Usuário ou senha inválidos.");
    }
  }

  return (
    <div className="min-h-screen bg-[#101323] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#181e32] rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="CoinbitClub" className="h-12 mb-2" />
          <h1 className="text-2xl font-bold text-cyan-400 mb-2">Entrar na sua conta</h1>
          <span className="text-sm text-gray-400">Acesse seu painel de operações</span>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-300 mb-1" htmlFor="email">E-mail</label>
            <input
              className="w-full px-4 py-2 rounded-xl bg-[#23263a] border border-[#23263a] focus:border-cyan-400 outline-none text-white"
              type="email"
              id="email"
              autoComplete="username"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1" htmlFor="password">Senha</label>
            <input
              className="w-full px-4 py-2 rounded-xl bg-[#23263a] border border-[#23263a] focus:border-cyan-400 outline-none text-white"
              type="password"
              id="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          {error && <div className="text-red-400 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full py-2 rounded-xl font-bold bg-cyan-400 hover:bg-cyan-300 text-black shadow transition"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <div className="text-center mt-4">
          <span className="text-gray-400 text-sm">Não tem uma conta?</span>{" "}
          <Link className="text-cyan-300 hover:underline text-sm" to="/signup">
            Criar agora
          </Link>
        </div>
        <div className="text-center mt-2">
          <Link className="text-gray-400 hover:text-cyan-300 text-xs" to="/">
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
