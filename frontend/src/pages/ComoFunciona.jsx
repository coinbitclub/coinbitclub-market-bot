import React from "react";
import { Link } from "react-router-dom";

export default function ComoFunciona() {
  return (
    <div className="bg-zinc-900 text-white min-h-screen px-6 py-10 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold text-yellow-400 mb-6">🔧 Como Funciona o MarketBot</h1>
      <div className="space-y-6 text-zinc-300 text-base leading-relaxed">
        <p><strong>1. Cadastro e Conexão:</strong> Crie sua conta, conecte sua corretora (como Binance ou Bybit) via API sem permissão de saque e escolha seu plano.</p>
        <p><strong>2. Ativação do Robô:</strong> Após ativar, o sistema monitora o mercado com apoio de IA e sinais validados.</p>
        <p><strong>3. Execução de Operações:</strong> O robô envia ordens automáticas baseadas em critérios de risco pré-definidos configuráveis por você.</p>
        <p><strong>4. Gestão de Performance:</strong> Acompanhe tudo em tempo real no painel: sinais, operações, lucros, perdas, estatísticas.</p>
        <p><strong>5. Cobrança e Comissão:</strong> Plano mensal (fixo + comissão reduzida) ou pré-pago (desconta apenas sobre lucro). Saldo mínimo: R$60 (Brasil) / USD 30 (Exterior).</p>
        <p><strong>6. Cancelamento e Reembolso:</strong> Livre a qualquer momento. Valores não usados podem ser reembolsados.</p>
      </div>
      <div className="mt-10 flex flex-col md:flex-row gap-4">
        <Link to="/register" className="bg-yellow-500 text-black px-6 py-3 rounded font-semibold text-center">Quero Começar Agora</Link>
        <Link to="/login" className="text-yellow-400 underline text-center">Já tenho conta</Link>
      </div>
    </div>
  );
}
