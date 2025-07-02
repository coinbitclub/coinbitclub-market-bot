import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function CommissionSettings() {
  const [percentAfiliado, setPercentAfiliado] = useState(50);
  const [percentMensalidade, setPercentMensalidade] = useState(8);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Configurações de Comissão</h1>
      <div className="bg-card rounded-xl shadow border border-border p-8 max-w-xl">
        <div className="mb-6">
          <label className="block mb-2">% de comissão do afiliado sobre 1ª mensalidade</label>
          <input
            type="number"
            value={percentAfiliado}
            onChange={e => setPercentAfiliado(e.target.value)}
            className="w-full p-2 rounded border border-border bg-background"
            min={1}
            max={100}
          />
        </div>
        <div className="mb-6">
          <label className="block mb-2">% comissão mensalidade BR (admin)</label>
          <input
            type="number"
            value={percentMensalidade}
            onChange={e => setPercentMensalidade(e.target.value)}
            className="w-full p-2 rounded border border-border bg-background"
            min={1}
            max={100}
          />
        </div>
        <Button>Salvar Alterações</Button>
      </div>
    </div>
  );
}
