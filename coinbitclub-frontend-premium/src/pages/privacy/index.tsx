import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

const PrivacyPage = () => {
  return (
    <>
      <Head>
        <title>Termos de Uso, Política de Privacidade e Como Funciona o MarketBot - CoinbitClub</title>
      </Head>
      <main className="min-h-screen bg-slate-900 text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              Termos de Uso, Política de Privacidade e Como Funciona o MarketBot
            </h1>
            <p className="mt-4 text-lg text-slate-400">CoinbitClub - MarketBot</p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none text-slate-300">
            <h2>1. Definições</h2>
            <ul>
              <li><strong>MarketBot:</strong> sistema automatizado de operações em criptomoedas, operado pela CoinbitClub, com base em lógica algorítmica e inteligência artificial.</li>
              <li><strong>Usuário:</strong> pessoa física ou jurídica que contrata os serviços da CoinbitClub para utilização do MarketBot.</li>
            </ul>

            <h2>2. Planos e Remuneração</h2>
            <ul>
              <li><strong>Plano Mensal:</strong> o Usuário paga mensalmente um valor fixo e a comissão aplicada sobre o lucro das operações realizadas é de 10%.</li>
              <li><strong>Plano Pré-pago:</strong> o Usuário realiza um aporte antecipado, e a comissão sobre o lucro gerado é de 20%, debitada automaticamente do saldo pré-pago.</li>
              <li>Ambos os planos exigem saldo mínimo em conta para execução. A CoinbitClub é remunerada exclusivamente com base no lucro gerado, conforme o plano escolhido.</li>
            </ul>

            <h2>3. Objeto do Serviço</h2>
            <p>
              A CoinbitClub fornece um sistema inteligente que executa operações automáticas com criptoativos nas contas dos Usuários, com base em sinais de mercado e decisões algorítmicas. As ordens são lançadas diretamente nas exchanges integradas (Bybit ou Binance), mediante autorização via API.
            </p>

            <h2>4. Funcionamento do MarketBot</h2>
            <ul>
              <li>O robô analisa dados de mercado e aplica critérios técnicos e estatísticos para tomada de decisões.</li>
              <li>A lógica é baseada em leitura de volume, momentum, F&G index, RSI, ATR, EMAs e dominância BTC, entre outros.</li>
              <li>O sistema pode abrir até duas operações simultâneas por assinatura ativa.</li>
              <li>O Usuário pode configurar alavancagem, stop loss e take profit dentro dos limites da plataforma.</li>
            </ul>

            <h2>5. Inteligência Artificial e Responsabilidade</h2>
            <p>
              O Usuário reconhece que as decisões são tomadas por inteligência artificial e algoritmos estatísticos. A CoinbitClub não garante performance futura, lucros ou ausência de perdas. O uso do robô implica aceitação dos riscos inerentes ao mercado de criptoativos.
            </p>

            <h2>6. Custódia e Acesso aos Fundos</h2>
            <ul>
              <li>O MarketBot opera exclusivamente por meio das APIs configuradas pelo Usuário.</li>
              <li>Não há acesso direto da CoinbitClub aos fundos; a custódia permanece sob a exchange do Usuário.</li>
              <li>É de responsabilidade do Usuário configurar as permissões corretas (apenas “trade”, sem saque).</li>
            </ul>

            <h2>7. Política de Reembolso</h2>
            <ul>
              <li><strong>Plano Mensal:</strong> não há reembolso após o pagamento da mensalidade.</li>
              <li><strong>Plano Pré-pago:</strong> o saldo não utilizado pode ser reembolsado mediante solicitação, em até 72h úteis, descontadas taxas administrativas e comissões já devidas.</li>
            </ul>

            <h2>8. Limitação de Responsabilidade</h2>
            <p>A CoinbitClub não se responsabiliza por:</p>
            <ul>
              <li>Erros, falhas ou indisponibilidades das exchanges integradas.</li>
              <li>Perdas decorrentes de flutuações de mercado, ataques ou mau uso das APIs por parte do Usuário.</li>
              <li>Falta de saldo suficiente ou erros na configuração das permissões das chaves de API.</li>
            </ul>

            <h2>9. Atualizações nos Termos</h2>
            <p>
              Estes termos podem ser modificados com aviso prévio de 7 dias úteis por e-mail cadastrado. O uso contínuo do sistema após a vigência das alterações será considerado como concordância tácita.
            </p>

            <h2>10. Vigência e Cancelamento</h2>
            <ul>
              <li>O contrato entra em vigor com a contratação e permanece válido até o cancelamento por qualquer das partes.</li>
              <li>A CoinbitClub se reserva o direito de suspender o acesso em casos de uso indevido ou violação destes Termos.</li>
            </ul>

            <h2>11. Foro Competente</h2>
            <p>
              Fica eleito o foro da comarca de Niterói/RJ, com exclusão de qualquer outro, por mais privilegiado que seja, para resolução de controvérsias decorrentes deste contrato.
            </p>

            <h2>Política de Privacidade</h2>
            <ul>
              <li><strong>Coleta:</strong> e-mail, chaves públicas de API, comportamento de uso e interações com o sistema.</li>
              <li><strong>Uso:</strong> autenticação, envio de alertas, análise de performance e melhoria do sistema.</li>
              <li><strong>Compartilhamento:</strong> não há repasse de dados a terceiros, salvo exigência legal.</li>
              <li><strong>Retenção:</strong> os dados são armazenados enquanto a conta estiver ativa. Após cancelamento, serão anonimizados em até 90 dias.</li>
            </ul>

            <h2>Declaração de Aceite</h2>
            <p>
              Ao contratar o MarketBot, o Usuário declara estar ciente, de forma expressa e inequívoca, das condições aqui descritas, inclusive quanto aos riscos de mercado, política de reembolso e operação via IA.
            </p>

            <div className="mt-8 text-center">
              <Link 
                href="/auth/register"
                className="inline-flex items-center rounded-lg bg-emerald-600 px-6 py-3 text-base font-medium text-white shadow-lg transition-colors hover:bg-emerald-700"
              >
                Voltar ao Cadastro
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default PrivacyPage;



