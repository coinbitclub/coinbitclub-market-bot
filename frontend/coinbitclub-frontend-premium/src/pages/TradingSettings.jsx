import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function TradingSettings() {
  const [estrategia, setEstrategia] = useState("Conservadora");
  const [lote, setLote] = useState(100);
  const [alavancagem, setAlavancagem] = useState(2);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Ajustes do Bot</h1>
      <div className="bg-card rounded-xl shadow border border-border p-8 max-w-xl">
        <div className="mb-6">
          <label className="block mb-2">Estratégia</label>
          <select
            className="w-full p-2 rounded border border-border bg-background"
            value={estrategia}
            onChange={e => setEstrategia(e.target.value)}
          >
            <option>Conservadora</option>
            <option>Moderada</option>
            <option>Agressiva</option>
          </select>
        </div>
        <div className="mb-6">
          <label className="block mb-2">Tamanho do lote (USD)</label>
          <input
            type="number"
            value={lote}
            onChange={e => setLote(e.target.value)}
            className="w-full p-2 rounded border border-border bg-background"
            min={10}
            max={10000}
          />
        </div>
        <div className="mb-6">
          <label className="block mb-2">Alavancagem</label>
          <input
            type="number"
            value={alavancagem}
            onChange={e => setAlavancagem(e.target.value)}
            className="w-full p-2 rounded border border-border bg-background"
            min={1}
            max={100}
          />
        </div>
        <Button>Salvar Ajustes</Button>
      </div>
    </div>
  );
}
