import React from "react";

export default function Register() {
  return (
    <div className="min-h-screen flex justify-center items-center bg-zinc-900 text-white">
      <form className="bg-zinc-800 p-8 rounded-xl shadow max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold text-yellow-400 mb-4">Criar Conta</h1>
        <input className="w-full p-2 bg-zinc-700 rounded" placeholder="Nome completo" />
        <input className="w-full p-2 bg-zinc-700 rounded" placeholder="E-mail" type="email" />
        <input className="w-full p-2 bg-zinc-700 rounded" placeholder="País" />
        <input className="w-full p-2 bg-zinc-700 rounded" placeholder="Telefone" />
        <input className="w-full p-2 bg-zinc-700 rounded" placeholder="CPF" />
        <input className="w-full p-2 bg-zinc-700 rounded" placeholder="Senha" type="password" />
        <input className="w-full p-2 bg-zinc-700 rounded" placeholder="Confirmar senha" type="password" />
        <label className="flex items-center space-x-2 text-sm">
          <input type="checkbox" className="accent-yellow-500" required />
          <span>Li e aceito os <a href="/termos" className="underline text-yellow-400">Termos de Uso</a></span>
        </label>
        <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 rounded">Cadastrar</button>
      </form>
    </div>
  );
}

