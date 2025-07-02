import React from "react";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div className="bg-light p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-dark">Entrar no CoinbitClub</h2>
        {/* Aqui virá o formulário de login */}
        <form>
          <input className="w-full p-3 mb-4 rounded-lg border" type="email" placeholder="Email" />
          <input className="w-full p-3 mb-4 rounded-lg border" type="password" placeholder="Senha" />
          <button className="w-full bg-primary text-white font-semibold py-3 rounded-lg mt-2 hover:bg-accent transition">Entrar</button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <a href="/cadastro" className="text-primary hover:underline">Criar conta</a>
          <a href="#" className="text-gray-400 hover:underline">Esqueci minha senha</a>
        </div>
        <div className="mt-6 text-center">
          <a href="/admin/login" className="text-accent font-semibold hover:underline">Sou administrador</a>
        </div>
      </div>
    </div>
  );
}
