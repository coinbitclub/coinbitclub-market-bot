export default function AuditLogs() {
  // Mock de logs (faça fetch real do backend)
  const logs = [
    { id: 1, user: "admin", acao: "Login", data: "2024-06-28 09:10", detalhe: "Login realizado com sucesso" },
    { id: 2, user: "joao", acao: "Cadastro", data: "2024-06-28 09:15", detalhe: "Novo usuário registrado" },
    { id: 3, user: "admin", acao: "Alteração de Plano", data: "2024-06-28 09:20", detalhe: "Plano alterado para Pro" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Logs de Auditoria</h1>
      <div className="bg-card rounded-xl shadow border border-border p-6">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2">Usuário</th>
              <th>Ação</th>
              <th>Data/Hora</th>
              <th>Detalhe</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} className="border-b border-border">
                <td className="py-2">{l.user}</td>
                <td>{l.acao}</td>
                <td>{l.data}</td>
                <td>{l.detalhe}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
