import { Home, BarChart2, Users, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="bg-card w-64 min-h-screen flex flex-col gap-2 py-6 px-2 border-r border-border">
      <Link to="/user/dashboard" className="flex items-center gap-3 p-2 hover:bg-background rounded">
        <Home size={22} /> Dashboard
      </Link>
      <Link to="/user/operations" className="flex items-center gap-3 p-2 hover:bg-background rounded">
        <BarChart2 size={22} /> Operações
      </Link>
      <Link to="/user/profile" className="flex items-center gap-3 p-2 hover:bg-background rounded">
        <Users size={22} /> Perfil
      </Link>
      <button className="flex items-center gap-3 p-2 hover:bg-background rounded mt-auto text-red-500">
        <LogOut size={22} /> Sair
      </button>
    </aside>
  );
}
