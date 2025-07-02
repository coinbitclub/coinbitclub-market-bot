import { useEffect, useState } from "react";
import StatsCards from "../components/Dashboard/StatsCards";
import TradesTable from "../components/Dashboard/TradesTable";
import api from "../utils/api";

export default function DashboardUser() {
  const [stats, setStats] = useState({ saldo: 0, acertos: 0, erros: 0, lucro: 0 });
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Exemplo de endpoints (ajuste para o seu backend!)
    async function fetchData() {
      setLoading(true);
      try {
        const resStats = await api.get("/api/user/stats"); // Endpoint do seu backend
        const resTrades = await api.get("/api/user/trades?limit=10");
        setStats(resStats.data);
        setTrades(resTrades.data);
      } catch (err) {
        // Aqui você pode usar um toast para erro!
        setStats({ saldo: 0, acertos: 0, erros: 0, lucro: 0 });
        setTrades([]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Dashboard Operacional</h1>
      {loading ? (
        <div className="my-8 text-muted-foreground">Carregando...</div>
      ) : (
        <>
          <StatsCards {...stats} />
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-2">Operações Recentes</h2>
            <TradesTable data={trades} />
          </div>
        </>
      )}
    </div>
  );
}
