import React, { useEffect, useState } from "react";
import axios from "axios";
import SidebarAdmin from "../../components/SidebarAdmin";

const API_BASE = process.env.REACT_APP_API_URL || "";

export default function AdminOperacoes() {
  const [operacoes, setOperacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function fetchOperacoes() {
      setLoading(true);
      setErro("");
      try {
        const token = localStorage.getItem("admin_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE}/api/admin/operacoes?limit=30`, { headers });
        setOperacoes(res.data.operacoes || []);
      } catch (err) {
        setErro("Erro ao carregar operações.");
      }
      setLoading(false);
    }
    fetchOperacoes();
  }, []);

  return (
    <div className="flex min-h-screen bg-dark text-light">
      <SidebarAdmin />
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold mb-6 text-accent">Operações (Andamento/Fechadas)</h2>
        {erro && <div className="bg-red-600 text-white p-3 mb-4 rounded">{erro}</div>}
        {loading ? (
          <div className="text-center py-16 text-lg">Carregando...</div>
        ) : (
          <div className="bg-light rounded-xl shadow p-6 text-dark">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2">ID</th>
                  <th className="py-2">Usuário</th>
                  <th className="py-2">Ativo</th>
                  <th className="py-2">Tipo</th>
                  <th className="py-2">Entrada</th>
                  <th className="py-2">Saída</th>
                  <th className="py-2">Resultado</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {operacoes.length === 0 ? (
                  <tr><td colSpan={8}>Nenhuma operação encontrada.</td></tr>
                ) : operacoes.map(op => (
                  <tr key={op.id}>
                    <td>{op.id}</td>
                    <td>{op.usuarioNome}</td>
                    <td>{op.ativo}</td>
                    <td>{op.tipo}</td>
                    <td>{op.entrada}</td>
                    <td>{op.saida}</td>
                    <td className={op.resultado > 0 ? "text-green-600" : "text-red-600"}>
                      {op.resultado}
                    </td>
                    <td>{op.status}</td>
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
