import React, { useEffect, useState } from "react";
import axios from "axios";
import SidebarAdmin from "../../components/SidebarAdmin";

const API_BASE = process.env.REACT_APP_API_URL || "";

export default function AdminFinanceiro() {
  const [financeiro, setFinanceiro] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function fetchFinanceiro() {
      setLoading(true);
      setErro("");
      try {
        const token = localStorage.getItem("admin_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE}/api/admin/financeiro`, { headers });
        setFinanceiro(res.data.financeiro || []);
      } catch (err) {
        setErro("Erro ao carregar dados financeiros.");
      }
      setLoading(false);
    }
    fetchFinanceiro();
  }, []);

  return (
    <div className="flex min-h-screen bg-dark text-light">
      <SidebarAdmin />
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold mb-6 text-accent">Financeiro</h2>
        {erro && <div className="bg-red-600 text-white p-3 mb-4 rounded">{erro}</div>}
        {loading ? (
          <div className="text-center py-16 text-lg">Carregando...</div>
        ) : (
          <div className="bg-light rounded-xl shadow p-6 text-dark">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2">ID</th>
                  <th className="py-2">Tipo</th>
                  <th className="py-2">Valor</th>
                  <th className="py-2">Usuário</th>
                  <th className="py-2">Data</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {financeiro.length === 0 ? (
                  <tr><td colSpan={6}>Nenhuma movimentação encontrada.</td></tr>
                ) : financeiro.map(f => (
                  <tr key={f.id}>
                    <td>{f.id}</td>
                    <td>{f.tipo}</td>
                    <td>{f.valor}</td>
                    <td>{f.usuarioNome}</td>
                    <td>{f.data}</td>
                    <td>{f.status}</td>
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
