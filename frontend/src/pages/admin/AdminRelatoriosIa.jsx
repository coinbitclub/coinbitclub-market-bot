import React, { useEffect, useState } from "react";
import axios from "axios";
import SidebarAdmin from "../../components/SidebarAdmin";

const API_BASE = process.env.REACT_APP_API_URL || "";

export default function AdminRelatoriosIa() {
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function fetchRelatorios() {
      setLoading(true);
      setErro("");
      try {
        const token = localStorage.getItem("admin_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE}/api/admin/relatorios-ia`, { headers });
        setRelatorios(res.data.relatorios || []);
      } catch (err) {
        setErro("Erro ao carregar relatórios IA.");
      }
      setLoading(false);
    }
    fetchRelatorios();
  }, []);

  return (
    <div className="flex min-h-screen bg-dark text-light">
      <SidebarAdmin />
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold mb-6 text-accent">Relatórios de IA / Leitura de Mercado</h2>
        {erro && <div className="bg-red-600 text-white p-3 mb-4 rounded">{erro}</div>}
        {loading ? (
          <div className="text-center py-16 text-lg">Carregando...</div>
        ) : (
          <div className="bg-light rounded-xl shadow p-6 text-dark max-h-[600px] overflow-y-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2">Data/Hora</th>
                  <th className="py-2">Resumo</th>
                  <th className="py-2">Direção</th>
                  <th className="py-2">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {relatorios.length === 0 ? (
                  <tr><td colSpan={4}>Nenhum relatório encontrado.</td></tr>
                ) : relatorios.map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.dataHora || '-'}</td>
                    <td>{r.resumo || '-'}</td>
                    <td>{r.direcao || '-'}</td>
                    <td>{r.detalhes || '-'}</td>
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
