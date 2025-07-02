export default function WithdrawHistory() {
  const history = [
    { id: 1, tipo: "Saque", valor: 150, data: "2024-06-28", status: "Processado" },
    { id: 2, tipo: "Depósito", valor: 250, data: "2024-06-20", status: "Concluído" },
    { id: 3, tipo: "Saque", valor: 100, data: "2024-06-15", status: "Pendente" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Histórico de Saques/Depósitos</h1>
      <div className="bg-card rounded-xl shadow border border-border p-6">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2">Tipo</th>
              <th>Valor</th>
              <th>Data</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map(h => (
              <tr key={h.id} className="border-b border-border">
                <td className="py-2">{h.tipo}</td>
                <td className={h.tipo === "Saque" ? "text-red-400" : "text-green-400"}>
                  {h.tipo === "Saque" ? "-R$ " : "R$ "}
                  {h.valor.toFixed(2)}
                </td>
                <td>{h.data}</td>
                <td>
                  <span className={
                    h.status === "Processado" || h.status === "Concluído"
                      ? "text-green-400" : "text-yellow-400"
                  }>
                    {h.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
