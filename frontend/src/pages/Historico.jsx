import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const API_BASE = process.env.REACT_APP_API_URL || "";

export default function Historico() {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function fetchHistorico() {
      setLoading(true);
      setErro("");
      try {
        const token = localStorage.getItem("user_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE}/api/user/historico`, { headers });
        setHistorico(res.data.historico || []);
      } catch (err) {
        setErro("Erro ao carregar histórico.");
      }
      setLoading(false);
    }
    fetchHistorico();
  }, []);

  return (
    <div className="flex min-h-screen bg-dark text-light">
      <Sidebar />
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold mb-6 text-accent">Histórico de Operações</h2>
        {erro && <div className="bg-red-600 text-white p-3 mb-4 rounded">{erro}</div>}
        {loading ? (
          <div className="text-center py-16 text-lg">Carregando...</div>
        ) : (
          <div className="bg-light rounded-xl shadow p-6 text-dark">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2">Data</th>
                  <th className="py-2">Ativo</th>
                  <th className="py-2">Entrada</th>
                  <th className="py-2">Saída</th>
                  <th className="py-2">Resultado (USD)</th>
                  <th className="py-2">Retorno (%)</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {historico.length === 0 ? (
                  <tr><td colSpan={7}>Nenhuma operação encontrada.</td></tr>
                ) : historico.map((op, idx) => (
                  <tr key={idx}>
                    <td>{op.data}</td>
                    <td>{op.ativo}</td>
                    <td>{op.entrada}</td>
                    <td>{op.saida}</td>
                    <td className={op.resultadoUSD > 0 ? "text-green-600" : "text-red-600"}>
                      {op.resultadoUSD}
                    </td>
                    <td className={op.resultadoPct > 0 ? "text-green-600" : "text-red-600"}>
                      {op.resultadoPct}%
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
