import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a1123] text-white flex">
      
      {/* Sidebar */}
      <nav className="w-64 p-6 bg-[#101323]">
        <h2 className="text-2xl font-bold mb-8">Painel Admin</h2>
        <ul className="space-y-4">
          <li><NavLink to="/admin" end className="hover:text-cyan-400">Dashboard</NavLink></li>
          <li><NavLink to="/admin/operations" className="hover:text-cyan-400">Operações</NavLink></li>
          <li><NavLink to="/admin/alerts" className="hover:text-cyan-400">Alertas/Logs</NavLink></li>
          <li><NavLink to="/admin/finance" className="hover:text-cyan-400">Financeiro</NavLink></li>
          <li><NavLink to="/admin/users" className="hover:text-cyan-400">Usuários</NavLink></li>
          <li><NavLink to="/admin/affiliates" className="hover:text-cyan-400">Afiliados</NavLink></li>
          <li><NavLink to="/admin/parameters" className="hover:text-cyan-400">Parâmetros</NavLink></li>
        </ul>
        <button
          onClick={logout}
          className="mt-10 px-4 py-2 bg-red-600 rounded w-full"
        >
          Sair
        </button>
      </nav>
      
      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
