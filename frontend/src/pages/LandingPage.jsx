import React from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#121c2b] to-[#181d2a] text-white flex flex-col items-center px-2">
      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center py-8">
        <div className="flex items-center space-x-4">
          <img src="/logo.png" alt="CoinbitClub Logo" className="h-14 drop-shadow-xl" />
          <span className="text-2xl font-extrabold tracking-tight text-yellow-300">CoinbitClub</span>
        </div>
        <Link to="/login" className="bg-cyan-400 text-black font-bold py-2 px-6 rounded-xl hover:bg-cyan-300 transition shadow">
          ÁREA DO ASSINANTE
        </Link>
      </header>

      {/* HERO */}
      <section className="flex flex-col items-center text-center mt-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-cyan-300 drop-shadow-lg">CoinbitClub MarketBot</h1>
        <h2 className="text-2xl md:text-3xl font-bold mb-5 text-white">PARE DE PERDER TEMPO E DINHEIRO NO MERCADO DE CRIPTO!</h2>
        <p className="max-w-2xl text-lg mb-6 text-gray-200">
          Deixe a tecnologia operar por você — com seu dinheiro seguro na sua exchange.<br />
          <span className="font-bold">Teste grátis por 7 dias. Saldo SEMPRE seguro!</span>
        </p>
        <Link to="/cadastro" className="bg-cyan-400 text-black font-extrabold py-4 px-10 rounded-2xl text-lg shadow-lg hover:bg-cyan-300 transition mb-3">
          QUERO TESTAR GRÁTIS POR 7 DIAS!
        </Link>
        <span className="mt-1 text-xs text-gray-300">
          7 dias grátis • Sem compromisso • Saldo seguro na sua exchange
        </span>
      </section>

      {/* DIFERENCIAIS */}
      <section className="max-w-6xl w-full grid md:grid-cols-3 gap-8 mb-20">
        <div className="bg-[#20293a] rounded-xl p-6 text-left shadow-lg border border-cyan-900">
          <h3 className="font-bold text-cyan-300 mb-2">Saldo sempre seguro</h3>
          <p>Seu saldo nunca sai da sua exchange. CoinbitClub não tem acesso ao seu dinheiro.</p>
        </div>
        <div className="bg-[#20293a] rounded-xl p-6 text-left shadow-lg border border-cyan-900">
          <h3 className="font-bold text-cyan-300 mb-2">Automação com IA 24/7</h3>
          <p>Robô próprio, inteligência artificial operando o tempo todo, todos os dias.</p>
        </div>
        <div className="bg-[#20293a] rounded-xl p-6 text-left shadow-lg border border-cyan-900">
          <h3 className="font-bold text-cyan-300 mb-2">Só paga no lucro</h3>
          <p>Comissão apenas sobre ganhos. Zero cobrança no prejuízo.</p>
        </div>
        <div className="bg-[#20293a] rounded-xl p-6 text-left shadow-lg border border-cyan-900">
          <h3 className="font-bold text-cyan-300 mb-2">Controle total</h3>
          <p>Pause, ajuste ou desligue quando quiser, sem burocracia.</p>
        </div>
        <div className="bg-[#20293a] rounded-xl p-6 text-left shadow-lg border border-cyan-900">
          <h3 className="font-bold text-cyan-300 mb-2">Setup dos 3 pilares</h3>
          <p>Leitura de mercado, identificação da tendência, escolha inteligente das moedas.</p>
        </div>
        <div className="bg-[#20293a] rounded-xl p-6 text-left shadow-lg border border-cyan-900">
          <h3 className="font-bold text-cyan-300 mb-2">Comunidade & suporte real</h3>
          <p>Grupo ativo, suporte rápido e dúvidas resolvidas de verdade.</p>
        </div>
      </section>

      {/* TESTE GRÁTIS */}
      <section className="max-w-4xl w-full bg-[#20293a] rounded-xl p-8 mb-14 flex flex-col items-center shadow-xl border border-cyan-900">
        <h3 className="text-xl font-bold mb-2 text-cyan-300">Teste grátis sem risco</h3>
        <p className="mb-4 text-center text-gray-200">Experimente por 7 dias na sua conta demo Binance ou Bybit, sem custo e sem compromisso.</p>
        <ol className="list-decimal list-inside text-left mb-4 space-y-1">
          <li>Cadastre-se rapidamente</li>
          <li>Conecte a testnet Binance/Bybit</li>
          <li>Veja o robô operando AO VIVO com dinheiro virtual</li>
          <li>Decida só depois se quer investir de verdade</li>
        </ol>
        <Link to="/cadastro" className="bg-cyan-400 text-black font-bold py-3 px-8 rounded-xl text-lg mt-2 hover:bg-cyan-300 transition">
          QUERO TESTAR AGORA
        </Link>
      </section>

      {/* COMO FUNCIONA */}
      <section className="max-w-6xl w-full mb-16">
        <h3 className="text-2xl font-bold text-cyan-300 mb-6 text-center">Como Funciona</h3>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              titulo: "Cadastro rápido",
              texto: "Preencha seus dados em menos de 1 minuto.",
            },
            {
              titulo: "Conecte à exchange",
              texto: "API simples, segura, sem acesso ao seu saldo.",
            },
            {
              titulo: "Escolha o plano",
              texto: "Mensalidade ou pré-pago, só paga no lucro.",
            },
            {
              titulo: "Veja o robô em ação",
              texto: "Operações automatizadas ao vivo na sua conta.",
            }
          ].map((item, i) => (
            <div key={i} className="bg-[#20293a] rounded-xl p-6 text-center shadow border border-cyan-900">
              <h4 className="font-bold text-cyan-200 mb-2">{item.titulo}</h4>
              <p className="text-gray-200">{item.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PLANOS FLEXÍVEIS */}
      <section className="max-w-4xl w-full mb-16">
        <h3 className="text-2xl font-bold text-cyan-300 mb-4 text-center">Planos Flexíveis</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#20293a] rounded-xl p-6 shadow border border-cyan-900">
            <h4 className="font-bold text-yellow-300 mb-2">Plano Mensalidade Reduzida</h4>
            <ul className="list-disc ml-5 mb-2 text-gray-200">
              <li>Mensalidade fixa pequena</li>
              <li>Comissão menor sobre lucro</li>
              <li>Ideal para operar sempre</li>
            </ul>
          </div>
          <div className="bg-[#20293a] rounded-xl p-6 shadow border border-cyan-900">
            <h4 className="font-bold text-yellow-300 mb-2">Plano Pré-Pago</h4>
            <ul className="list-disc ml-5 mb-2 text-gray-200">
              <li>Sem mensalidade</li>
              <li>Comissão um pouco maior sobre lucro</li>
              <li>Ideal para testar ou operar menos</li>
            </ul>
          </div>
        </div>
        <div className="text-xs text-gray-300 mt-3 text-center">
          Em ambos os planos, seu dinheiro continua 100% na sua exchange.<br />
          Só pagamos comissão em caso de lucro.
        </div>
      </section>

      {/* PROVA SOCIAL */}
      <section className="max-w-4xl w-full mb-16">
        <h3 className="text-2xl font-bold text-cyan-300 mb-4 text-center">Quem já aprovou</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#20293a] rounded-xl p-6 shadow border border-cyan-900 text-center">
            <div className="mb-2">
              <img src="/avatar1.png" alt="Depoimento" className="mx-auto rounded-full h-16 w-16 mb-2" />
              <span className="font-bold text-white">Juliana, SP</span>
            </div>
            <p className="italic text-gray-200">"Robô muito prático, consegui operar enquanto trabalhava!"</p>
          </div>
          <div className="bg-[#20293a] rounded-xl p-6 shadow border border-cyan-900 text-center">
            <div className="mb-2">
              <img src="/avatar2.png" alt="Depoimento" className="mx-auto rounded-full h-16 w-16 mb-2" />
              <span className="font-bold text-white">Carlos, PR</span>
            </div>
            <p className="italic text-gray-200">"Testei 7 dias na demo e agora só uso a conta real."</p>
          </div>
          <div className="bg-[#20293a] rounded-xl p-6 shadow border border-cyan-900 text-center">
            <div className="mb-2">
              <img src="/avatar3.png" alt="Depoimento" className="mx-auto rounded-full h-16 w-16 mb-2" />
              <span className="font-bold text-white">Fernanda, RJ</span>
            </div>
            <p className="italic text-gray-200">"Automatizei e parei de perder tempo estudando trade!"</p>
          </div>
        </div>
        <div className="text-center text-xs mt-3 text-gray-400">Mais de 700 usuários já testaram o CoinbitClub MarketBot!</div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl w-full mb-16">
        <h3 className="text-2xl font-bold text-cyan-300 mb-4 text-center">Perguntas Frequentes</h3>
        <div className="divide-y divide-cyan-900">
          {[
            {
              q: "Preciso transferir dinheiro para o CoinbitClub?",
              a: "Não! Seu dinheiro fica sempre na sua exchange. Nunca temos acesso ao seu saldo."
            },
            {
              q: "O que é testnet?",
              a: "É um ambiente de simulação das exchanges (Binance/Bybit) para testar sem arriscar dinheiro real."
            },
            {
              q: "Consigo desligar o robô quando quiser?",
              a: "Sim! Você tem controle total sobre o robô, pode pausar ou desligar a qualquer momento."
            },
            {
              q: "Quais os riscos?",
              a: "Mercado de ativos digitais é de alto risco. Resultados passados não garantem ganhos futuros."
            },
            {
              q: "Preciso entender de trading?",
              a: "Não. Nossa solução automatiza tudo para você — do setup à execução das operações."
            },
            {
              q: "Como funciona a cobrança da comissão?",
              a: "Só cobramos comissão quando houver lucro de verdade — nada de taxa fixa no prejuízo!"
            },
          ].map((item, i) => (
            <details key={i} className="p-4 bg-[#181d2a] rounded-lg my-2">
              <summary className="font-semibold text-cyan-300 cursor-pointer">{item.q}</summary>
              <div className="mt-2 text-gray-200">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-4xl w-full flex flex-col items-center mb-10">
        <h3 className="text-2xl font-bold mb-3 text-cyan-300 text-center">Pronto para ver o MarketBot em ação sem arriscar seu dinheiro?</h3>
        <div className="text-center mb-3 text-gray-200">Teste grátis 7 dias • Controle total • Dinheiro sempre na sua conta</div>
        <Link to="/cadastro" className="bg-cyan-400 text-black font-extrabold py-4 px-10 rounded-2xl text-lg shadow-lg hover:bg-cyan-300 transition mb-2">
          QUERO TESTAR GRÁTIS AGORA!
        </Link>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-6xl text-xs text-gray-400 text-center pb-8 mt-auto">
        Seu dinheiro, sua conta, sua decisão. CoinbitClub nunca toca no seu saldo.<br />
        <a href="/termos" className="underline">Termos de Uso</a> | <a href="/privacidade" className="underline">Política de Privacidade</a> | <a href="mailto:suporte@coinbitclub.vip" className="underline">Suporte</a>
      </footer>
    </main>
  );
}
