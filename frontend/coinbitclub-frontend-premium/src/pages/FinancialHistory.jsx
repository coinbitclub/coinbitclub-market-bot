export default function FinancialHistory() {
  // Exemplo (mock)
  const history = [
    { id: 1, tipo: "Depósito", valor: 300, data: "2024-06-15" },
    { id: 2, tipo: "Comissão", valor: -24, data: "2024-06-20" },
    { id: 3, tipo: "Retirada", valor: -100, data: "2024-06-22" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Histórico Financeiro</h1>
      <div className="bg-card rounded-xl shadow border border-border p-6">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2">Data</th>
              <th>Tipo</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {history.map(item => (
              <tr key={item.id} className="border-b border-border">
                <td className="py-2">{item.data}</td>
                <td>{item.tipo}</td>
                <td className={item.valor < 0 ? "text-red-400" : "text-green-400"}>
                  {item.valor < 0 ? "-R$ " : "R$ "}
                  {Math.abs(item.valor).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
