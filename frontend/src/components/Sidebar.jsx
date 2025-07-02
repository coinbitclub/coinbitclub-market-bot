import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FiHome, FiList, FiDollarSign, FiLayers, FiKey, FiHelpCircle, FiLogOut } from "react-icons/fi";

const links = [
  { to: "/app", label: "Dashboard", icon: <FiHome /> },
  { to: "/app/historico", label: "Histórico", icon: <FiList /> },
  { to: "/app/planos", label: "Planos", icon: <FiLayers /> },
  { to: "/app/financeiro", label: "Financeiro", icon: <FiDollarSign /> },
  { to: "/app/api-keys", label: "API Keys", icon: <FiKey /> },
  { to: "/app/ajuda", label: "Ajuda", icon: <FiHelpCircle /> }
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="bg-[#181f2a] w-64 min-h-screen flex flex-col shadow-lg">
      <div className="h-20 flex items-center justify-center border-b border-gray-800 mb-6">
        <img src="/logo.png" alt="CoinbitClub" className="h-12" />
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center px-4 py-3 rounded-lg text-md font-medium hover:bg-accent/10 transition ${
              location.pathname === link.to ? "bg-accent/20 text-accent" : "text-white"
            }`}
          >
            <span className="mr-3 text-xl">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto p-4 border-t border-gray-800">
        <button className="flex items-center w-full px-4 py-2 rounded-lg bg-accent/20 text-accent font-semibold hover:bg-accent/40 transition">
          <FiLogOut className="mr-2" />
          Sair
        </button>
      </div>
    </aside>
  );
}
