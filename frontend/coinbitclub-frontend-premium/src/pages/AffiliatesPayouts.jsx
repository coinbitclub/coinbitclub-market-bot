import { Button } from "@/components/ui/button";

export default function AffiliatesPayouts() {
  const pagamentos = [
    { id: 1, afiliado: "João Silva", valor: 180, status: "Pago", data: "2024-07-01" },
    { id: 2, afiliado: "Ana Souza", valor: 92, status: "Pendente", data: "2024-06-25" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pagamentos de Afiliados</h1>
      <div className="bg-card rounded-xl shadow border border-border p-6">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2">Afiliado</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pagamentos.map(p => (
              <tr key={p.id} className="border-b border-border">
                <td className="py-2">{p.afiliado}</td>
                <td>R$ {p.valor.toFixed(2)}</td>
                <td>
                  {p.status === "Pago" ? (
                    <span className="text-green-400 font-semibold">Pago</span>
                  ) : (
                    <span className="text-yellow-400 font-semibold">Pendente</span>
                  )}
                </td>
                <td>{p.data}</td>
                <td>
                  {p.status !== "Pago" && (
                    <Button size="sm" variant="outline">Marcar como Pago</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
