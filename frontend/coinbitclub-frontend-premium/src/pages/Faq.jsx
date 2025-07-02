import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const faqs = [
  {
    q: "Como funciona o teste grátis?",
    a: "Ao criar sua conta, você pode conectar uma conta testnet na Binance ou Bybit e acompanhar o robô operando em tempo real, sem risco."
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim! Não há fidelidade, mensalidades podem ser pausadas e saldo pré-pago pode ser sacado."
  },
  {
    q: "Como funciona a cobrança da comissão?",
    a: "Você só paga comissão sobre lucro efetivo, diretamente do saldo pré-pago. Sem lucro, sem comissão!"
  },
  {
    q: "O robô opera em quais corretoras?",
    a: "Atualmente, Binance e Bybit. Mais exchanges em breve!"
  },
  {
    q: "Preciso deixar saldo no site?",
    a: "Não! O saldo fica sempre na sua exchange. O site apenas calcula e gerencia o uso da plataforma."
  }
];

export default function Faq() {
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
      <section className="flex-1 flex flex-col items-center py-12 px-4">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">FAQ</h1>
        <div className="max-w-3xl w-full space-y-6">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-card border border-border rounded-xl p-6 shadow">
              <div className="text-lg font-bold text-cyan-400 mb-2">{faq.q}</div>
              <div className="text-muted-foreground">{faq.a}</div>
            </div>
          ))}
        </div>
      </section>
      <footer className="text-muted-foreground text-sm text-center py-4 border-t border-[#23263a]">
        © {new Date().getFullYear()} CoinbitClub MarketBot. Todos os direitos reservados.
      </footer>
    </div>
  );
}
