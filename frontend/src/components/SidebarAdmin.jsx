import React from "react";
import { Link } from "react-router-dom";

export default function SidebarAdmin() {
  return (
    <aside className="w-64 bg-dark border-r border-gray-800 min-h-screen p-6">
      <div className="mb-8">
        <span className="font-extrabold text-2xl text-accent">Admin</span>
      </div>
      <nav className="flex flex-col space-y-4">
        <Link to="/admin" className="hover:text-accent">Dashboard</Link>
        <Link to="/admin/usuarios" className="hover:text-accent">Usuários</Link>
        <Link to="/admin/afiliados" className="hover:text-accent">Afiliados</Link>
        <Link to="/admin/operacoes" className="hover:text-accent">Operações</Link>
        <Link to="/admin/financeiro" className="hover:text-accent">Financeiro</Link>
        <Link to="/admin/logs" className="hover:text-accent">Logs</Link>
        <Link to="/admin/relatorios-ia" className="hover:text-accent">Relatórios IA</Link>
        {/* Adicione outros links se desejar */}
      </nav>
    </aside>
  );
}
