import { useState } from "react";
import api from "../utils/api";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setErro("");
    setSuccess("");
    try {
      // Troque o endpoint conforme sua API!
      await api.post("/api/auth/register", {
        nome,
        email,
        senha,
        telefone
      });
      setSuccess("Cadastro realizado com sucesso! Faça login para acessar.");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setErro("Erro ao cadastrar usuário. Tente outro e-mail.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSignup} className="bg-card rounded-2xl shadow-xl p-8 w-full max-w-sm flex flex-col gap-5 border border-border">
        <h1 className="text-2xl font-bold text-cyan-400 mb-3">Cadastrar Conta</h1>
        <input
          type="text"
          placeholder="Nome completo"
          className="p-3 rounded bg-background border border-border focus:outline-none"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="E-mail"
          className="p-3 rounded bg-background border border-border focus:outline-none"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <i
