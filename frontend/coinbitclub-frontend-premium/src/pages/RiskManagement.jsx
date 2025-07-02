import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function RiskManagement() {
  const [maxLoss, setMaxLoss] = useState(2);
  const [maxTrades, setMaxTrades] = useState(5);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gestão de Riscos</h1>
      <div className="bg-card rounded-xl shadow border border-border p-8 max-w-lg">
        <div className="mb-6">
          <label className="block mb-2">Máximo de perda diária (%)</label>
          <input
            type="number"
            value={maxLoss}
            onChange={e => setMaxLoss(e.target.value)}
            className="w-full p-2 rounded border border-border bg-background"
            min={0}
            max={100}
          />
        </div>
        <div className="mb-6">
          <label className="block mb-2">Máximo de operações/dia</label>
          <input
            type="number"
            value={maxTrades}
            onChange={e => setMaxTrades(e.target.value)}
            className="w-full p-2 rounded border border-border bg-background"
            min={1}
            max={100}
          />
        </div>
        <Button>Salvar Configurações</Button>
      </div>
    </div>
  );
}
