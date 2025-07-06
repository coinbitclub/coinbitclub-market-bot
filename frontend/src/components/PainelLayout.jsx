import React from "react";
import { Link, Outlet } from "react-router-dom";

export default function PainelLayout() {
  return (
    <div className="flex min-h-screen bg-zinc-900 text-white">
      <aside className="w-64 bg-zinc-800 p-6 space-y-4 hidden md:block">
        <h2 className="text-xl font-bold text-yellow-400 mb-6">Menu</h2>
        <nav className="flex flex-col space-y-2 text-sm">
          <Link to="/painel" className="hover:text-yellow-300">Dashboard</Link>
          <Link to="/painel/plano" className="hover:text-yellow-300">Meu Plano</Link>
          <Link to="/painel/riscos" className="hover:text-yellow-300">Parâmetros de Risco</Link>
          <Link to="/painel/configuracoes" className="hover:text-yellow-300">Minhas Configurações</Link>
          <Link to="/painel/extrato" className="hover:text-yellow-300">Extrato</Link>
          <Link to="/painel/sinais" className="hover:text-yellow-300">Sinais</Link>
        </nav>
      </aside>
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}
