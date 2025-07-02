export default function Header() {
  return (
    <header className="bg-card shadow flex items-center justify-between px-6 py-3 border-b border-border">
      <div className="flex items-center gap-4">
        <img src="/logo.png" alt="Logo" className="h-10" />
        <span className="font-bold text-cyan-400 text-xl">CoinbitClub MarketBot</span>
      </div>
      <div className="flex items-center gap-2">
        {/* Avatar e ações do usuário */}
      </div>
    </header>
  );
}
