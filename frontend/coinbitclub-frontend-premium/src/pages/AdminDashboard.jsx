import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-cyan-400 mb-4">Painel Administrativo</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl p-6 shadow border border-border">
          <div className="text-muted-foreground text-sm">Usuários cadastrados</div>
          <div className="text-3xl font-extrabold text-white mt-2">123</div>
        </div>
        <div className="bg-card rounded-xl p-6 shadow border border-border">
          <div className="text-muted-foreground text-sm">Afiliados ativos</div>
          <div className="text-3xl font-extrabold text-white mt-2">16</div>
        </div>
        <div className="bg-card rounded-xl p-6 shadow border border-border">
          <div className="text-muted-foreground text-sm">Comissões pagas (R$)</div>
          <div className="text-3xl font-extrabold text-cyan-300 mt-2">4.220</div>
        </div>
      </div>
      <div className="mt-8">
        <Button className="mr-4">Gerenciar Usuários</Button>
        <Button variant="outline">Gerenciar Afiliados</Button>
      </div>
    </div>
  );
}
