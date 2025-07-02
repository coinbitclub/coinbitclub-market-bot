export default function UserActivity() {
  // Exemplo
  const atividades = [
    { id: 1, acao: "Login realizado", data: "2024-07-01 11:15" },
    { id: 2, acao: "Operação aberta: BTC/USDT", data: "2024-07-01 11:16" },
    { id: 3, acao: "Solicitou saque", data: "2024-07-01 13:00" }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Minhas Atividades</h1>
      <div className="bg-card rounded-xl shadow border border-border p-6">
        <ul className="space-y-2">
          {atividades.map(a => (
            <li key={a.id} className="flex items-center gap-6">
              <span className="text-muted-foreground text-sm">{a.data}</span>
              <span>{a.acao}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
