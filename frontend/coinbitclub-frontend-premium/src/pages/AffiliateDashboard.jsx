import { Button } from "@/components/ui/button";

export default function AffiliateDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-cyan-400 mb-4">Painel do Afiliado</h1>
      <div className="bg-card rounded-xl p-6 shadow border border-border mb-6">
        <div className="text-lg font-semibold mb-2">Seu link de indicação:</div>
        <div className="bg-background text-cyan-300 px-4 py-2 rounded-lg mb-2 select-all font-mono">
          https://coinbitclub.com.br/r/SEULINK123
        </div>
        <Button>Copiar Link</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 shadow border border-border">
          <div className="text-muted-foreground text-sm">Indicações ativas</div>
          <div className="text-3xl font-extrabold text-white mt-2">8</div>
        </div>
        <div className="bg-card rounded-xl p-6 shadow border border-border">
          <div className="text-muted-foreground text-sm">Comissões pendentes</div>
          <div className="text-3xl font-extrabold text-cyan-300 mt-2">R$ 460</div>
        </div>
      </div>
    </div>
  );
}
