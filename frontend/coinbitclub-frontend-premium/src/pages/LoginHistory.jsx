export default function LoginHistory() {
  // Mock de histórico (fetch real do backend)
  const logins = [
    { id: 1, user: "admin", data: "2024-06-27 18:22", sucesso: true, ip: "200.200.200.1" },
    { id: 2, user: "joao", data: "2024-06-27 18:30", sucesso: false, ip: "200.200.200.5" },
    { id: 3, user: "joao", data: "2024-06-27 18:32", sucesso: true, ip: "200.200.200.5" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Histórico de Login</h1>
      <div className="bg-card rounded-xl shadow border border-border p-6">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2">Usuário</th>
              <th>Data/Hora</th>
              <th>IP</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {logins.map(l => (
              <tr key={l.id} className="border-b border-border">
                <td className="py-2">{l.user}</td>
                <td>{l.data}</td>
                <td>{l.ip}</td>
                <td>
                  {l.sucesso ? (
                    <span className="text-green-400 font-semibold">Sucesso</span>
                  ) : (
                    <span className="text-red-400 font-semibold">Falha</span>
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
