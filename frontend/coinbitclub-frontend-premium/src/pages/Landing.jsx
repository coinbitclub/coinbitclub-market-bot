import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* HEADER */}
      <header className="flex justify-between items-center px-8 py-6 border-b border-[#23263a]">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="CoinbitClub" className="h-12" />
          <span className="text-2xl font-extrabold text-cyan-300 tracking-wide">CoinbitClub MarketBot</span>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/login")}>Entrar</Button>
          <Button onClick={() => navigate("/signup")} variant="outline" className="border-cyan-400 text-cyan-400">
            Criar Conta
          </Button>
        </div>
      </header>

      {/* HERO */}
      <section className="flex flex-1 flex-col items-center justify-center text-center px-8">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 mt-6">
          Operações automáticas e performance de elite <br /> <span className="text-cyan-400">com IA em tempo real</span>
        </h1>
        <p className="max-w-2xl text-lg md:text-2xl text-muted mb-8">
          Sua conta operando 24h com sinais profissionais, análise de risco e monitoramento total.
          <br />
          <span className="font-semibold text-cyan-300">Veja tudo em tempo real, teste grátis, plano flexível e suporte premium.</span>
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button size="lg" className="text-lg px-8 py-4 font-bold" onClick={() => navigate("/signup")}>
            Quero usar grátis agora
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-cyan-400 border-cyan-400 text-lg px-8 py-4 font-bold"
            onClick={() => navigate("/login")}
          >
            Já sou usuário
          </Button>
        </div>
      </section>
      {/* Footer */}
      <footer className="text-muted-foreground text-sm text-center py-4 border-t border-[#23263a]">
        © {new Date().getFullYear()} CoinbitClub MarketBot. Todos os direitos reservados.
      </footer>
    </div>
  );
}
