export default function AdminUsers() {
  // Exemplo de dados (substitua por fetch real depois)
  const users = [
    { id: 1, nome: "João Silva", email: "joao@teste.com", status: "ativo", criado: "2024-05-10" },
    { id: 2, nome: "Maria Souza", email: "maria@teste.com", status: "inativo", criado: "2024-05-12" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Usuários Cadastrados</h1>
      <div className="bg-card rounded-xl shadow border border-border p-6">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2">Nome</th>
              <th>E-mail</th>
              <th>Status</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-border">
                <td className="py-2">{u.nome}</td>
                <td>{u.email}</td>
                <td>
                  <span className={u.status === "ativo" ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>
                    {u.status}
                  </span>
                </td>
                <td>{u.criado}</td>
                <td>
                  <button className="text-cyan-400 hover:underline mr-4">Editar</button>
                  <button className="text-red-400 hover:underline">Desativar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
