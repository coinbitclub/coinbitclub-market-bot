import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function Dashboard() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      setErro("");
      try {
        const token = localStorage.getItem("user_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE}/api/user/dashboard`, { headers });
        setDados(res.data);
      } catch (err) {
        setErro("Erro ao carregar informações do dashboard.");
      }
      setLoading(false);
    }
    fetchDashboard();
  }, []);

  return (
    <div className="flex min-h-screen bg-dark text-light">
      <Sidebar />
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold mb-6 text-accent">Dashboard</h2>
        {erro && <div className="bg-red-600 text-white p-3 mb-4 rounded">{erro}</div>}
        {loading ? (
          <div className="text-center py-16 text-lg">Carregando...</div>
        ) : (
          <>
            {/* Cards principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <div className="bg-light p-6 rounded-xl shadow text-dark">
                <div className="font-semibold text-lg mb-2">Rentabilidade do Dia</div>
                <div className={`text-3xl font-bold ${dados?.rentDiaUSD > 0 ? "text-green-600" : "text-red-600"}`}>
                  {dados?.rentDiaUSD ? `US$ ${dados.rentDiaUSD}` : '-'}
                </div>
                <div className={`text-lg font-bold ${dados?.rentDiaPct > 0 ? "text-green-600" : "text-red-600"}`}>
                  {dados?.rentDiaPct ? `${dados.rentDiaPct}%` : '-'}
                </div>
              </div>
              <div className="bg-light p-6 rounded-xl shadow text-dark">
                <div className="font-semibold text-lg mb-2">Rentabilidade Histórica</div>
                <div className={`text-3xl font-bold ${dados?.rentHistUSD > 0 ? "text-green-600" : "text-red-600"}`}>
                  {dados?.rentHistUSD ? `US$ ${dados.rentHistUSD}` : '-'}
                </div>
                <div className={`text-lg font-bold ${dados?.rentHistPct > 0 ? "text-green-600" : "text-red-600"}`}>
                  {dados?.rentHistPct ? `${dados.rentHistPct}%` : '-'}
                </div>
              </div>
              <div className="bg-light p-6 rounded-xl shadow text-dark">
                <div className="font-semibold text-lg mb-2">Saldo Pré-Pago</div>
                <div className="text-3xl font-bold">
                  {dados?.saldoPrePago ? `US$ ${dados.saldoPrePago}` : '-'}
                </div>
                <div className="text-xs text-gray-500">Disponível para operar</div>
              </div>
              <div className="bg-light p-6 rounded-xl shadow text-dark">
                <div className="font-semibold text-lg mb-2">Saldo na Corretora</div>
                <div className="text-3xl font-bold">
                  {dados?.saldoCorretora ? `US$ ${dados.saldoCorretora}` : '-'}
                </div>
                <div className="text-xs text-gray-500">Bybit/Binance</div>
              </div>
            </div>
            {/* Cards secundários */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-light p-6 rounded-xl shadow text-dark">
                <div className="font-semibold mb-2">Operações em andamento</div>
                <div className="text-2xl font-bold">{dados?.operando ?? '-'}</div>
              </div>
              <div className="bg-light p-6 rounded-xl shadow text-dark">
                <div className="font-semibold mb-2">Operações fechadas hoje</div>
                <div className="text-2xl font-bold">{dados?.fechadasHoje ?? '-'}</div>
              </div>
            </div>
            {/* Filtros históricos */}
            <div className="mb-6 flex flex-wrap gap-4">
              <button className="px-4 py-2 bg-primary text-white rounded hover:bg-accent">Último mês</button>
              <button className="px-4 py-2 bg-primary text-white rounded hover:bg-accent">Acumulado</button>
              <button className="px-4 py-2 bg-primary text-white rounded hover:bg-accent">Personalizar</button>
            </div>
            {/* Histórico de operações resumido */}
            <div className="bg-light rounded-xl shadow p-6 text-dark">
              <div className="font-bold mb-2">Últimas operações</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2">Data</th>
                      <th className="py-2">Ativo</th>
                      <th className="py-2">Entrada</th>
                      <th className="py-2">Saída</th>
                      <th className="py-2">Resultado (USD)</th>
                      <th className="py-2">Retorno (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados?.historico?.length === 0 ? (
                      <tr><td colSpan={6}>Nenhuma operação encontrada.</td></tr>
                    ) : dados?.historico?.map((op, idx) => (
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
