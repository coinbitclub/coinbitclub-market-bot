import { Button } from "@/components/ui/button";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">Fale Conosco</h1>
        <p className="max-w-xl text-muted-foreground text-lg text-center mb-8">
          Dúvidas, sugestões ou suporte? Preencha o formulário abaixo ou fale direto via WhatsApp.
        </p>
        <form className="bg-card rounded-2xl shadow-xl p-8 w-full max-w-lg flex flex-col gap-5 border border-border">
          <input type="text" placeholder="Seu nome" className="p-3 rounded bg-background border border-border" required />
          <input type="email" placeholder="Seu e-mail" className="p-3 rounded bg-background border border-border" required />
          <textarea placeholder="Mensagem" rows={5} className="p-3 rounded bg-background border border-border" required />
          <Button type="submit" className="w-full">Enviar Mensagem</Button>
          <a
            href="https://wa.me/5521987386645"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 text-center hover:underline"
          >
            Atendimento rápido no WhatsApp
          </a>
        </form>
      </section>
      <footer className="text-muted-foreground text-sm text-center py-4 border-t border-[#23263a]">
        © {new Date().getFullYear()} CoinbitClub MarketBot. Todos os direitos reservados.
      </footer>
    </div>
  );
}
