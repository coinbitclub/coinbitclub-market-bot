import { Button } from "@/components/ui/button";

export default function Integrations() {
  // Mock (fetch real depois)
  const integrations = [
    { id: 1, nome: "Binance", status: "Ativo", tipo: "Exchange", connected: true },
    { id: 2, nome: "Bybit", status: "Ativo", tipo: "Exchange", connected: true },
    { id: 3, nome: "OpenAI", status: "Inativo", tipo: "IA", connected: false },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Integrações</h1>
      <div className="bg-card rounded-xl shadow border border-border p-6">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2">Serviço</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {integrations.map(i => (
              <tr key={i.id} className="border-b border-border">
                <td className="py-2">{i.nome}</td>
                <td>{i.tipo}</td>
                <td>
                  {i.connected ? (
                    <span className="text-green-400 font-semibold">Conectado</span>
                  ) : (
                    <span className="text-red-400 font-semibold">Desconectado</span>
                  )}
                </td>
                <td>
                  {i.connected ? (
                    <Button size="sm" variant="destructive">Desconectar</Button>
                  ) : (
                    <Button size="sm">Conectar</Button>
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
