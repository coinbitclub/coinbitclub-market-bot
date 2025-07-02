import React, { useEffect, useState } from "react";
import axios from "axios";
import SidebarAdmin from "../../components/SidebarAdmin";

const API_BASE = process.env.REACT_APP_API_URL || ""; // Configure no .env

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [sinais, setSinais] = useState([]);
  const [operacoes, setOperacoes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setErro("");
      try {
        const token = localStorage.getItem("admin_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [overviewRes, sinaisRes, operacoesRes, logsRes] = await Promise.all([
          axios.get(`${API_BASE}/api/admin/overview`, { headers }),
          axios.get(`${API_BASE}/api/admin/sinais`, { headers }),
          axios.get(`${API_BASE}/api/admin/operacoes?limit=5`, { headers }),
          axios.get(`${API_BASE}/api/admin/logs?limit=5`, { headers })
        ]);
        setOverview(overviewRes.data);
        setSinais(sinaisRes.data.sinais || []);
        setOperacoes(operacoesRes.data.operacoes || []);
        setLogs(logsRes.data.logs || []);
      } catch (err) {
        setErro("Erro ao carregar dados do painel administrativo.");
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen bg-dark text-light">
      <SidebarAdmin />
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold mb-6 text-accent">Painel Administrativo</h2>
        {erro && <div className="bg-red-600 text-white p-3 mb-4 rounded">{erro}</div>}
        {loading ? (
          <div className="text-center py-16 text-lg">Carregando informações...</div>
        ) : (
          <>
            {/* Cards principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <div className="bg-light p-6 rounded-xl shadow text-dark">
                <div className="font-semibold text-lg mb-2">Saldo total pré-pago</div>
                <div className="text-3xl font-bold">{overview?.saldoTotalPrePago ? `US$ ${overview.saldoTotalPrePago}` : '-'}</div>
              </div>
              <div className="bg-light p-6 rounded-xl shadow text-dark">
                <div className="font-semibold text-lg mb-2">Receita (mensalidade)</div>
                <div className="text-3xl font-bold text-green-600">{overview?.receitaMensalidade ? `US$ ${overview.receitaMensalidade}` : '-'}</div>
              </div>
              <div className="bg-light p-6 rounded-xl shadow text-dark">
                <div className="font-semibold text-lg mb-2">Comissões a pagar</div>
                <div className="text-3xl font-bold text-yellow-500">{overview?.comissoesPendentes ? `US$ ${overview.comissoesPendentes}` : '-'}</div>
              </div>
              <div className="bg-light p-6 rounded-xl shadow text-dark">
                <div className="font-semibold text-lg mb-2">Usuários ativos</div>
                <div className="text-3xl font-bold">{overview?.usuariosAtivos ?? '-'}</div>
              </div>
            </div>
            {/* Sinais e Leitura IA */}
            <div className="bg-light rounded-xl shadow p-6 mb-8 text-dark">
              <div className="font-bold mb-2">Últimos sinais recebidos / Leitura de IA</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2">Hora</th>
                      <th className="py-2">Fonte</th>
                      <th className="py-2">Ativo</th>
                      <th className="py-2">Direção</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sinais.length === 0 ? (
                      <tr><td colSpan={5}>Nenhum sinal recebido.</td></tr>
                    ) : sinais.map((sinal, idx) => (
                      <tr key={idx}>
                        <td>{sinal.hora || '-'}</td>
                        <td>{sinal.fonte || '-'}</td>
                        <td>{sinal.ativo || '-'}</td>
                        <td>{sinal.direcao || '-'}</td>
                        <td>{sinal.status || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Operações em andamento/fechadas */}
            <div className="bg-light rounded-xl shadow p-6 mb-8 text-dark">
              <div className="font-bold mb-2">Operações recentes</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2">Data</th>
                      <th className="py-2">Usuário</th>
                      <th className="py-2">Ativo</th>
                      <th className="py-2">Tipo</th>
                      <th className="py-2">Resultado (USD)</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operacoes.length === 0 ? (
                      <tr><td colSpan={6}>Nenhuma operação encontrada.</td></tr>
                    ) : operacoes.map((op, idx) => (
                      <tr key={idx}>
                        <td>{op.data || '-'}</td>
                        <td>{op.usuario || '-'}</td>
                        <td>{op.ativo || '-'}</td>
                        <td>{op.tipo || '-'}</td>
                        <td className={op.resultadoUSD > 0 ? "text-green-600" : "text-red-600"}>
                          {op.resultadoUSD > 0 ? "+" : ""}{op.resultadoUSD}
                        </td>
                        <td>{op.status || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Logs recentes */}
            <div className="bg-light rounded-xl shadow p-6 mb-8 text-dark">
              <div className="font-bold mb-2">Logs do sistema</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
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
            </div>
          </>
        )}
      </main>
    </div>
  );
}
