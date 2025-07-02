// (Você pode integrar gráficos reais depois com Chart.js, Recharts, etc.)
export default function PerformanceReport() {
  // Mock de dados
  const resumo = {
    totalTrades: 50,
    acertos: 38,
    erros: 12,
    lucroTotal: 22.7,
    assertividade: 76
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Relatório de Performance</h1>
      <div className="grid md:grid-cols-5 gap-6 mb-8">
        <div className="bg-card rounded-xl p-6 text-center border border-border">
          <div className="text-muted-foreground">Operações</div>
          <div className="text-2xl font-bold">{resumo.totalTrades}</div>
        </div>
        <div className="bg-card rounded-xl p-6 text-center border border-border">
          <div className="text-muted-foreground">Acertos</div>
          <div className="text-2xl font-bold text-green-400">{resumo.acertos}</div>
        </div>
        <div className="bg-card rounded-xl p-6 text-center border border-border">
          <div className="text-muted-foreground">Erros</div>
          <div className="text-2xl font-bold text-red-400">{resumo.erros}</div>
        </div>
        <div className="bg-card rounded-xl p-6 text-center border border-border">
          <div className="text-muted-foreground">Lucro (%)</div>
          <div className="text-2xl font-bold text-cyan-400">{resumo.lucroTotal}%</div>
        </div>
        <div className="bg-card rounded-xl p-6 text-center border border-border">
          <div className="text-muted-foreground">Assertividade</div>
          <div className="text-2xl font-bold">{resumo.assertividade}%</div>
        </div>
      </div>
      <div className="text-muted-foreground mb-2">Gráficos e análise detalhada em breve...</div>
    </div>
  );
}
