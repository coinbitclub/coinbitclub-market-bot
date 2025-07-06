import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';

export default function AffiliateLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-[#0a1123] text-white">
      {/* Sidebar */}
      <nav className="w-64 p-6 bg-[#101323]">
        <h2 className="text-2xl font-bold mb-8">Afiliado: {user?.name}</h2>
        <ul className="space-y-4">
          <li>
            <NavLink to="/afiliado" end className="hover:text-cyan-400">
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/afiliado/extrato" className="hover:text-cyan-400">
              Extrato de Comissão
            </NavLink>
          </li>
          <li>
            <NavLink to="/afiliado/convite" className="hover:text-cyan-400">
              Meu Link de Convite
            </NavLink>
          </li>
          <li>
            <NavLink to="/afiliado/saque" className="hover:text-cyan-400">
              Solicitar Saque
            </NavLink>
          </li>
        </ul>
        <button
          onClick={logout}
          className="mt-10 w-full px-4 py-2 bg-red-600 rounded"
        >
          Sair
        </button>
      </nav>

      {/* Conteúdo */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
