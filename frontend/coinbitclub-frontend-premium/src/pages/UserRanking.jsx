export default function UserRanking() {
  const users = [
    { id: 1, nome: "Ana Trader", lucro: 14.2, acertos: 89 },
    { id: 2, nome: "Bruno Bot", lucro: 9.1, acertos: 80 },
    { id: 3, nome: "Carlos Crypto", lucro: 5.7, acertos: 76 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Ranking de Usuários</h1>
      <div className="bg-card rounded-xl shadow border border-border p-6">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2">Posição</th>
              <th>Nome</th>
              <th>Lucro (%)</th>
              <th>Acertos (%)</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className="border-b border-border">
                <td className="py-2 font-extrabold">{i + 1}º</td>
                <td>{u.nome}</td>
                <td className="text-cyan-400 font-semibold">{u.lucro}%</td>
                <td>{u.acertos}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
