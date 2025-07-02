import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function About() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex justify-between items-center px-8 py-6 border-b border-[#23263a]">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="CoinbitClub" className="h-12" />
          <span className="text-2xl font-extrabold text-cyan-300 tracking-wide">CoinbitClub MarketBot</span>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/planos")}>Planos</Button>
          <Button onClick={() => navigate("/login")}>Entrar</Button>
        </div>
      </header>
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
          Quem somos
        </h1>
        <p className="max-w-2xl text-lg md:text-2xl text-muted mb-8">
          O CoinbitClub MarketBot foi criado por traders experientes e desenvolvedores apaixonados por automação financeira. Nossa missão é democratizar o acesso à tecnologia de trading profissional com máxima transparência, segurança e rentabilidade.
        </p>
        <p className="max-w-xl text-lg text-muted-foreground mb-8">
          • <b>Robô operando 24h</b> em Binance, Bybit, e mais.<br/>
          • <b>Controle total</b> do seu saldo, risco e comissões.<br/>
          • <b>Suporte humano</b> real, rápido e transparente.<br/>
        </p>
        <Button size="lg" className="font-bold px-8 py-4" onClick={() => navigate("/signup")}>
          Quero testar grátis!
        </Button>
      </section>
      <footer className="text-muted-foreground text-sm text-center py-4 border-t border-[#23263a]">
        © {new Date().getFullYear()} CoinbitClub MarketBot. Todos os direitos reservados.
      </footer>
    </div>
  );
}
