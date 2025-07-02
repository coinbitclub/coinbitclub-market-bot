export default function AffiliateReport() {
  // Mock (faça fetch real depois)
  const affiliates = [
    { id: 1, nome: "Lucas Lima", indicados: 12, comissao: 380 },
    { id: 2, nome: "Patrícia Alves", indicados: 5, comissao: 140 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Relatório de Afiliados</h1>
      <div className="bg-card rounded-xl shadow border border-border p-6">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2">Afiliado</th>
              <th>Indicações</th>
              <th>Comissão Total</th>
            </tr>
          </thead>
          <tbody>
            {affiliates.map(a => (
              <tr key={a.id} className="border-b border-border">
                <td className="py-2">{a.nome}</td>
                <td>{a.indicados}</td>
                <td>R$ {a.comissao.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
