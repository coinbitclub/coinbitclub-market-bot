import React from "react";

export default function PoliticaPrivacidade() {
  return (
    <div className="bg-zinc-900 text-white px-6 py-10 max-w-4xl mx-auto leading-relaxed text-sm">
      <h1 className="text-3xl font-bold text-yellow-400 mb-6">?? Política de Privacidade – MarketBot</h1>
      <p><strong>Última atualização:</strong> 04 de julho de 2025</p>
      <ul className="list-disc ml-6 mt-4">
        <li><strong>1. Informações Coletadas</strong><br />
          • Dados pessoais: Nome, e-mail, telefone, país, IP e demais dados de cadastro.<br />
          • Dados operacionais: Logs de atividades, resultados de operações e saldo.<br />
          • Cookies: Para análise de uso e otimização da experiência.
        </li>
        <li className="mt-4"><strong>2. Uso das Informações</strong><br />
          • Para executar os serviços contratados.<br />
          • Para envio de avisos sobre saldo, planos, alertas ou atualizações.<br />
          • Para ações de suporte e relacionamento.
        </li>
        <li className="mt-4"><strong>3. Compartilhamento de Dados</strong><br />
          • Nunca vendemos seus dados.<br />
          • Compartilhamos apenas com serviços essenciais (pagamento, notificações, autenticação).
        </li>
        <li className="mt-4"><strong>4. Armazenamento e Segurança</strong><br />
          • Utilizamos criptografia e servidores seguros.<br />
          • As chaves de API são criptografadas e não acessadas manualmente.
        </li>
        <li className="mt-4"><strong>5. Direitos do Usuário</strong><br />
          Você pode:<br />
          • Solicitar acesso, alteração ou exclusão dos seus dados.<br />
          • Cancelar sua conta a qualquer momento.<br />
          • Solicitar reembolso do saldo pré-pago não utilizado.
        </li>
      </ul>
      <h2 className="text-xl text-yellow-300 mt-6 mb-2">?? Contato</h2>
      <p>E-mail: faleconosco@coinbitclub.vip<br />WhatsApp: +55 21 99596-6652</p>
    </div>
  );
}
