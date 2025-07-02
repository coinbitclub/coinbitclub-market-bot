export default function Notifications() {
  const notifications = [
    { id: 1, title: "Saldo pré-pago abaixo do mínimo", date: "2025-07-01", read: false },
    { id: 2, title: "Operação fechada com lucro: BTC/USDT", date: "2025-06-30", read: true },
    { id: 3, title: "Comissão de afiliado paga", date: "2025-06-29", read: true },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Notificações</h1>
      <div className="bg-card rounded-xl shadow border border-border p-6 space-y-3">
        {notifications.length === 0 ? (
          <div className="text-muted-foreground">Nenhuma notificação encontrada.</div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`flex items-center gap-4 ${!n.read ? "bg-background" : ""} p-3 rounded`}>
              <div className="flex-1">
                <span className="font-semibold">{n.title}</span>
                <span className="block text-xs text-muted-foreground">{n.date}</span>
              </div>
              {!n.read && <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
