import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Terms() {
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
        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-8">
          Termos de Uso
        </h1>
        <div className="bg-card border border-border rounded-2xl shadow-xl max-w-3xl w-full p-8 text-muted-foreground leading-relaxed">
          <p>
            Ao utilizar a plataforma CoinbitClub MarketBot, o usuário concorda com os seguintes termos:
          </p>
          <ul className="list-disc ml-6 my-4 space-y-1">
            <li>O usuário é responsável pelas decisões de investimento e operações realizadas.</li>
            <li>A CoinbitClub não tem acesso aos valores depositados nas exchanges.</li>
            <li>Os resultados passados não garantem performance futura.</li>
            <li>O uso dos robôs é recomendado para usuários com experiência ou após teste na conta demo.</li>
            <li>O usuário deve manter saldo mínimo pré-pago para continuidade do serviço.</li>
            <li>É proibido tentar manipular, copiar ou atacar o sistema.</li>
            <li>Planos disponíveis: mensalidade + % sobre lucro ou somente % sobre lucro, conforme área de atuação (BR ou exterior).</li>
            <li>Em caso de dúvidas, suporte estará disponível via WhatsApp e e-mail.</li>
          </ul>
          <p>
            Para dúvidas ou sugestões, entre em contato com nosso suporte.
          </p>
        </div>
      </section>
      <footer className="text-muted-foreground text-sm text-center py-4 border-t border-[#23263a]">
        © {new Date().getFullYear()} CoinbitClub MarketBot. Todos os direitos reservados.
      </footer>
    </div>
  );
}
