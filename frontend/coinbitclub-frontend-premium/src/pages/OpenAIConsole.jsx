import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function OpenAIConsole() {
  const [prompt, setPrompt] = useState("");
  const [historico, setHistorico] = useState([
    { id: 1, pergunta: "Me mostre análise de mercado BTC para hoje", resposta: "Tendência altista com suporte em 68k" },
    { id: 2, pergunta: "Quais moedas têm maior volume?", resposta: "BTC, ETH, SOL e BNB lideram o ranking." }
  ]);

  function enviarPrompt(e) {
    e.preventDefault();
    if (!prompt) return;
    setHistorico([{ id: Date.now(), pergunta: prompt, resposta: "Processando resposta IA..." }, ...historico]);
    setPrompt("");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Console OpenAI</h1>
      <form onSubmit={enviarPrompt} className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Digite sua pergunta..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          className="flex-1 p-2 rounded bg-background border border-border"
        />
        <Button type="submit">Enviar</Button>
      </form>
      <div className="space-y-4">
        {historico.map(h => (
          <div key={h.id} className="bg-card rounded-xl p-4 border border-border">
            <div className="font-bold text-cyan-400 mb-1">Pergunta: {h.pergunta}</div>
            <div className="text-muted-foreground">Resposta: {h.resposta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
