import React, { useEffect, useState } from "react";
import axios from "axios";
import SidebarAdmin from "../../components/SidebarAdmin";

const API_BASE = process.env.REACT_APP_API_URL || "";

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setErro("");
      try {
        const token = localStorage.getItem("admin_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE}/api/admin/logs?limit=100`, { headers });
        setLogs(res.data.logs || []);
      } catch (err) {
        setErro("Erro ao carregar logs.");
      }
      setLoading(false);
    }
    fetchLogs();
  }, []);

  return (
    <div className="flex min-h-screen bg-dark text-light">
      <SidebarAdmin />
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold mb-6 text-accent">Logs / Auditoria</h2>
        {erro && <div className="bg-red-600 text-white p-3 mb-4 rounded">{erro}</div>}
        {loading ? (
          <div className="text-center py-16 text-lg">Carregando...</div>
        ) : (
          <div className="bg-light rounded-xl shadow p-6 text-dark max-h-[600px] overflow-y-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2">Data/Hora</th>
                  <th className="py-2">Evento</th>
                  <th className="py-2">Usuário</th>
                  <th className="py-2">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={4}>Nenhum log registrado.</td></tr>
                ) : logs.map((log, idx) => (
                  <tr key={idx}>
                    <td>{log.dataHora || '-'}</td>
                    <td>{log.evento || '-'}</td>
                    <td>{log.usuario || '-'}</td>
                    <td>{log.descricao || '-'}</td>
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
