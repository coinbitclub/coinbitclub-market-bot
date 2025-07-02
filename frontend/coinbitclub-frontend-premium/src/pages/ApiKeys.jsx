import { Button } from "@/components/ui/button";

export default function ApiKeys() {
  // Mock de chaves (substitua por fetch/real backend)
  const keys = [
    { id: 1, nome: "Bybit API", criada: "2024-06-20", ativa: true, ultima_uso: "2024-06-28" },
    { id: 2, nome: "Binance API", criada: "2024-06-10", ativa: false, ultima_uso: "-" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Chaves de API</h1>
      <div className="bg-card rounded-xl shadow border border-border p-6">
        <table className="w-full text-left mb-6">
          <thead>
            <tr>
              <th className="py-2">Nome</th>
              <th>Criada em</th>
              <th>Último uso</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k.id} className="border-b border-border">
                <td className="py-2">{k.nome}</td>
                <td>{k.criada}</td>
                <td>{k.ultima_uso}</td>
                <td>
                  {k.ativa ? (
                    <span className="text-green-400 font-semibold">Ativa</span>
                  ) : (
                    <span className="text-red-400 font-semibold">Inativa</span>
                  )}
                </td>
                <td>
                  <Button size="sm" variant="outline" className="mr-2">Editar</Button>
                  <Button size="sm" variant="destructive">Remover</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button>Adicionar Nova Chave</Button>
      </div>
    </div>
  );
}
