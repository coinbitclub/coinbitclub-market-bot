import React from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="bg-gradient-to-br from-[#101323] via-[#181c34] to-[#090b16] min-h-screen font-sans text-white">
      {/* HEADER */}
      <header className="flex justify-between items-center px-8 py-5 border-b border-cyan-800 bg-[#101323]/80 backdrop-blur">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="CoinbitClub" className="h-12 drop-shadow-lg" />
          <span className="text-2xl font-extrabold text-cyan-300 tracking-wide">CoinbitClub MarketBot</span>
        </div>
        <Link
          to="/login"
          className="bg-cyan-400 hover:bg-cyan-300 text-black font-bold px-6 py-2 rounded-full shadow transition"
        >
          Área do Assinante
        </Link>
      </header>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center gap-6 py-16 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight">
          Pare de <span className="text-cyan-300">perder tempo</span> e dinheiro.<br />
          Deixe o robô <span className="text-yellow-400">operar por você</span>.
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl">
          Resultados reais com IA, saldo <span className="font-bold text-cyan-300">sempre seguro na sua exchange</span>.<br />
          <span className="font-bold text-yellow-400">7 dias grátis</span>, sem compromisso!
        </p>
        <Link
          to="/cadastro"
          className="mt-6 bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-4 px-10 rounded-full text-xl shadow-lg transition"
        >
          QUERO TESTAR GRÁTIS POR 7 DIAS
        </Link>
      </section>

      {/* DIFERENCIAIS */}
      <section className="max-w-6xl mx-auto py-14 px-6 grid md:grid-cols-3 gap-8">
        <div className="bg-[#161b27] rounded-xl p-7 shadow-lg hover:shadow-cyan-400/20 transition-all border border-cyan-900/30">
          <h3 className="text-xl font-bold mb-3 text-cyan-300">Saldo Sempre Seguro</h3>
          <p className="text-gray-300">Seu dinheiro nunca sai da sua exchange. CoinbitClub não tem acesso ao seu saldo.</p>
        </div>
        <div className="bg-[#161b27] rounded-xl p-7 shadow-lg hover:shadow-cyan-400/20 transition-all border border-cyan-900/30">
          <h3 className="text-xl font-bold mb-3 text-cyan-300">Automação com IA 24/7</h3>
          <p className="text-gray-300">Robô próprio, inteligência artificial operando todos os dias e noites por você.</p>
        </div>
        <div className="bg-[#161b27] rounded-xl p-7 shadow-lg hover:shadow-cyan-400/20 transition-all border border-cyan-900/30">
          <h3 className="text-xl font-bold mb-3 text-cyan-300">Comissão Só no Lucro</h3>
          <p className="text-gray-300">Você só paga comissão quando tem lucro. Zero cobrança no prejuízo.</p>
        </div>
      </section>

      {/* VISUALIZAÇÃO EM TEMPO REAL (BLOCO ESTÁTICO) */}
      <section className="bg-gradient-to-r from-[#181c34] via-[#111726] to-[#101323] py-12">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 text-yellow-400">
            Visualize Seu Lucro em Tempo Real
          </h2>
          <div className="w-full rounded-xl shadow-2xl border border-cyan-600 bg-[#12192a] text-left p-8 flex flex-col gap-2">
            <p className="font-bold text-cyan-300 mb-1">Rentabilidade do dia: <span className="text-green-400">+3.2% / +$52.00</span></p>
            <p className="font-bold text-cyan-300 mb-1">Rentabilidade mês: <span className="text-green-400">+12.5% / +$320.00</span></p>
            <p className="text-gray-300">Tudo em tempo real e transparente direto no painel do assinante.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto py-14 px-6">
        <h2 className="text-2xl font-bold mb-8 text-cyan-300 text-center">Perguntas Frequentes</h2>
        <div className="space-y-6">
          <details className="bg-[#161b27] rounded p-4 cursor-pointer border border-cyan-900/30">
            <summary className="font-semibold text-yellow-400">Preciso transferir dinheiro para CoinbitClub?</summary>
            <p className="text-gray-300 mt-2">Não! Seu saldo nunca sai da sua exchange. Operamos apenas via API autorizada por você.</p>
          </details>
          <details className="bg-[#161b27] rounded p-4 cursor-pointer border border-cyan-900/30">
            <summary className="font-semibold text-yellow-400">Consigo desligar o robô quando quiser?</summary>
            <p className="text-gray-300 mt-2">Sim. Controle total: pause, ajuste ou desligue em tempo real pela sua área do assinante.</p>
          </details>
          <details className="bg-[#161b27] rounded p-4 cursor-pointer border border-cyan-900/30">
            <summary className="font-semibold text-yellow-400">Quais os riscos?</summary>
            <p className="text-gray-300 mt-2">Todo investimento em ativos digitais envolve risco. Você tem controle total e o sistema só cobra sobre lucro.</p>
          </details>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-cyan-400 text-black py-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Pronto para ver o MarketBot em ação?</h2>
        <p className="text-lg mb-8">Teste grátis por 7 dias. Sem compromisso.</p>
        <Link
          to="/cadastro"
          className="bg-black text-cyan-400 px-10 py-4 rounded-full font-bold text-xl hover:bg-gray-800 transition"
        >
          Quero Testar Agora!
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#101323] text-center text-gray-400 py-8 text-xs border-t border-cyan-900/30">
        © {new Date().getFullYear()} CoinbitClub. Seu dinheiro, sua decisão, sua conta.
        <br />
        <Link to="/termos" className="underline mx-2">Termos de Uso</Link>
        |
        <Link to="/privacidade" className="underline mx-2">Política de Privacidade</Link>
        |
        <a href="mailto:suporte@coinbitclub.vip" className="underline mx-2">Suporte</a>
      </footer>
    </div>
  );
}
