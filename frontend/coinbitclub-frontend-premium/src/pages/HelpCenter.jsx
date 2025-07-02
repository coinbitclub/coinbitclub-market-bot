import { useState } from "react";

const faqs = [
  { id: 1, pergunta: "Como configurar a API?", resposta: "Acesse a página de integrações, clique em conectar e siga as instruções da exchange." },
  { id: 2, pergunta: "Como funciona o teste gratuito?", resposta: "Crie sua conta, selecione Testnet e acompanhe operações reais sem risco." },
  { id: 3, pergunta: "Como sacar meus ganhos?", resposta: "Vá em Financeiro > Solicitar Saque, insira seus dados e confirme." },
];

export default function HelpCenter() {
  const [busca, setBusca] = useState("");
  const filtrados = faqs.filter(f =>
    f.pergunta.toLowerCase().includes(busca.toLowerCase()) ||
    f.resposta.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Base de Conhecimento</h1>
      <input
        type="text"
        placeholder="Buscar dúvida..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        className="w-full p-2 rounded bg-background border border-border mb-4"
      />
      <div className="space-y-4">
        {filtrados.length === 0 && <div className="text-muted-foreground">Nenhuma resposta encontrada.</div>}
        {filtrados.map(f => (
          <div key={f.id} className="bg-card border border-border rounded-xl p-4 shadow">
            <div className="font-semibold text-cyan-400 mb-1">{f.pergunta}</div>
            <div className="text-muted-foreground">{f.resposta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
