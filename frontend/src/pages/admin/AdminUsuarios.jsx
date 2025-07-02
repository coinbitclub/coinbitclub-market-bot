import React, { useEffect, useState } from "react";
import axios from "axios";
import SidebarAdmin from "../../components/SidebarAdmin";

const API_BASE = process.env.REACT_APP_API_URL || "";

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function fetchUsuarios() {
      setLoading(true);
      setErro("");
      try {
        const token = localStorage.getItem("admin_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE}/api/admin/usuarios`, { headers });
        setUsuarios(res.data.usuarios || []);
      } catch (err) {
        setErro("Erro ao carregar usuários.");
      }
      setLoading(false);
    }
    fetchUsuarios();
  }, []);

  return (
    <div className="flex min-h-screen bg-dark text-light">
      <SidebarAdmin />
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold mb-6 text-accent">Gestão de Usuários</h2>
        {erro && <div className="bg-red-600 text-white p-3 mb-4 rounded">{erro}</div>}
        {loading ? (
          <div className="text-center py-16 text-lg">Carregando...</div>
        ) : (
          <div className="bg-light rounded-xl shadow p-6 text-dark">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2">ID</th>
                  <th className="py-2">Nome</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Telefone</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Saldo</th>
                  <th className="py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr><td colSpan={7}>Nenhum usuário encontrado.</td></tr>
                ) : usuarios.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.nome}</td>
                    <td>{user.email}</td>
                    <td>{user.telefone}</td>
                    <td>{user.status}</td>
                    <td>{user.saldo}</td>
                    <td>
                      <button className="text-primary underline mr-2">Resetar Senha</button>
                      <button className="text-red-600 underline">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
