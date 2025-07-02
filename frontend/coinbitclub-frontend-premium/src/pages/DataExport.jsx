import { Button } from "@/components/ui/button";

export default function DataExport() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Exportar Dados</h1>
      <div className="bg-card rounded-xl shadow border border-border p-8 max-w-lg">
        <p className="mb-4">Exporte todas as suas operações, extratos financeiros ou histórico completo em CSV para análise ou controle pessoal.</p>
        <Button className="w-full mb-2">Exportar Operações (CSV)</Button>
        <Button className="w-full mb-2" variant="outline">Exportar Extrato Financeiro</Button>
        <Button className="w-full mb-2" variant="outline">Exportar Detalhes de Afiliado</Button>
      </div>
    </div>
  );
}
