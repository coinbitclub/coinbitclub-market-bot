export default function UpdateLogs() {
  const updates = [
    { id: 1, data: "2024-07-01", descricao: "Nova integração com OpenAI para análises de mercado." },
    { id: 2, data: "2024-06-28", descricao: "Adicionado sistema de alertas personalizados." },
    { id: 3, data: "2024-06-25", descricao: "Melhorias na tela de exportação de dados e relatórios financeiros." },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Novidades & Atualizações</h1>
      <div className="space-y-4">
        {updates.map(u => (
          <div key={u.id} className="bg-card border border-border rounded-xl p-4 shadow flex items-center gap-6">
            <span className="text-muted-foreground text-sm">{u.data}</span>
            <span>{u.descricao}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
