import React, { useState } from "react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Adicione lógica de login de admin aqui!
    alert("Login de admin simulado!");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-dark text-light">
      <form className="bg-light p-8 rounded-xl shadow text-dark max-w-sm w-full" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-4 text-center text-accent">Login Administrativo</h2>
        <div className="mb-4">
          <label className="block mb-1">Email</label>
          <input
            className="w-full border rounded p-3"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Senha</label>
          <input
            className="w-full border rounded p-3"
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
          />
        </div>
        <button className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-accent transition">Entrar</button>
      </form>
    </div>
  );
}
