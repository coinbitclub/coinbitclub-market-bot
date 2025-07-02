export default function Billing() {
  const pagamentos = [
    { id: 1, tipo: "Mensalidade", valor: 120, status: "Pago", data: "2024-07-01" },
    { id: 2, tipo: "Comissão", valor: 32, status: "Aguardando", data: "2024-06-24" },
    { id: 3, tipo: "Upgrade de Plano", valor: 70, status: "Pago", data: "2024-06-15" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pagamentos & Faturas</h1>
      <div className="bg-card rounded-xl shadow border border-border p-6">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2">Tipo</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {pagamentos.map(p => (
              <tr key={p.id} className="border-b border-border">
                <td className="py-2">{p.tipo}</td>
                <td>R$ {p.valor.toFixed(2)}</td>
                <td>
                  <span className={
                    p.status === "Pago"
                      ? "text-green-400" : "text-yellow-400"
                  }>
                    {p.status}
                  </span>
                </td>
                <td>{p.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
