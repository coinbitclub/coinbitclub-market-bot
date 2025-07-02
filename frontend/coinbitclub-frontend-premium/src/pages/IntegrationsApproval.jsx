import { Button } from "@/components/ui/button";

export default function IntegrationsApproval() {
  const pendentes = [
    { id: 1, user: "Carlos Crypto", tipo: "API Binance", status: "Pendente", data: "2024-07-02" },
    { id: 2, user: "Lucas Lima", tipo: "OpenAI", status: "Pendente", data: "2024-07-01" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Aprovar Integrações</h1>
      <div className="bg-card rounded-xl shadow border border-border p-6">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2">Usuário</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pendentes.map(i => (
              <tr key={i.id} className="border-b border-border">
                <td className="py-2">{i.user}</td>
                <td>{i.tipo}</td>
                <td><span className="text-yellow-400">{i.status}</span></td>
                <td>{i.data}</td>
                <td>
                  <Button size="sm" className="mr-2">Aprovar</Button>
                  <Button size="sm" variant="destructive">Reprovar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
