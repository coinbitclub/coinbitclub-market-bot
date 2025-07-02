import React from "react";
import { Link } from "react-router-dom";

// SVGs para reforçar o visual cripto/IA/segurança
const icons = {
  shield: (
    <svg className="w-8 h-8 mb-3 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 5.25-3.75 10-7 10S5 17.25 5 12V7l7-4z" />
    </svg>
  ),
  bot: (
    <svg className="w-8 h-8 mb-3 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <rect x="9" y="8" width="6" height="6" rx="2" fill="currentColor" />
      <circle cx="10.5" cy="11" r="1" fill="#fff" />
      <circle cx="13.5" cy="11" r="1" fill="#fff" />
    </svg>
  ),
  profit: (
    <svg className="w-8 h-8 mb-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 17l6-6 4 4 6-6" />
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2 19h20" />
    </svg>
  ),
  rocket: (
    <svg className="w-8 h-8 mb-3 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 19l4-4-1-4 9-9a2 2 0 113 3l-9 9-4-1-4 4 2 2z" />
    </svg>
  ),
};

export default function LandingPage() {
  return (
    <div className="bg-[#0c101b] min-h-screen font-sans text-white relative overflow-x-hidden">

      {/* BG ANIMADO */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-br from-cyan-900/40 via-indigo-800/40 to-[#101323]/80 blur-3xl opacity-80"></div>
        <div className="absolute bottom-0 right-0 w-[60vw] h-[30vw] bg-gradient-to-tr from-yellow-400/10 via-pink-500/5 to-cyan-400/10 blur-3xl rounded-full"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-700/10 via-transparent to-transparent"></div>
      </div>

      {/* HEADER */}
      <header className="flex justify-between items-center px-6 md:px-14 py-6 border-b border-cyan-800/50 bg-[#101323]/80 backdrop-blur-lg z-20 relative shadow-xl">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="CoinbitClub" className="h-12 drop-shadow-lg" />
          <span className="text-2xl font-extrabold text-cyan-300 tracking-wider">CoinbitClub MarketBot</span>
        </div>
        <Link
          to="/login"
          className="bg-cyan-400 hover:bg-cyan-300 text-black font-bold px-7 py-2 rounded-full shadow-md text-lg transition"
        >
          Área do Assinante
        </Link>
      </header>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center gap-7 py-20 md:py-32 px-4 text-center relative z-10">
        <span className="uppercase text-xs md:text-sm tracking-widest font-bold bg-cyan-400/20 text-cyan-200 px-4 py-2 rounded-full mb-2 animate-pulse shadow">
          O robô de cripto que só lucra junto com você
        </span>
        <h1 className="text-4xl md:text-6xl font-black leading-tight max-w-4xl drop-shadow-xl">
          Deixe a <span className="text-cyan-300">inteligência artificial</span> operar<br className="hidden md:block" /> seu <span className="text-yellow-400">dinheiro em cripto</span> 24/7.
        </h1>
        <p className="text-lg md:text-2xl text-gray-200 max-w-2xl mt-4">
          Teste grátis por <b className="text-yellow-400">7 dias</b>, saldo sempre <b className="text-cyan-300">seguro na sua exchange</b>.<br />
          Zero risco, zero compromisso, 100% controle seu!
        </p>
        <Link
          to="/cadastro"
          className="mt-8 bg-gradient-to-r from-yellow-400 via-yellow-300 to-cyan-400 hover:brightness-105 text-black font-black py-5 px-14 rounded-full text-2xl shadow-xl transition hover:scale-105"
        >
          QUERO TESTAR GRÁTIS
        </Link>
        <div className="flex gap-4 mt-8">
          <img src="/binance-logo.svg" alt="Binance" className="h-8 opacity-80" />
          <img src="/bybit-logo.svg" alt="Bybit" className="h-8 opacity-80" />
          {/* Adicione logos conforme desejar */}
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="max-w-6xl mx-auto py-16 px-6 grid md:grid-cols-3 gap-10 z-10 relative">
        <div className="bg-[#151b29] bg-opacity-80 rounded-2xl p-8 shadow-xl border border-cyan-800/40 hover:scale-105 hover:shadow-cyan-400/30 transition-all duration-300 flex flex-col items-center text-center">
          {icons.shield}
          <h3 className="text-2xl font-bold mb-2 text-cyan-300">Saldo Sempre Seguro</h3>
          <p className="text-gray-300">Seu dinheiro nunca sai da sua exchange. Acesso só via API autorizada.</p>
        </div>
        <div className="bg-[#151b29] bg-opacity-80 rounded-2xl p-8 shadow-xl border border-cyan-800/40 hover:scale-105 hover:shadow-cyan-400/30 transition-all duration-300 flex flex-col items-center text-center">
          {icons.bot}
          <h3 className="text-2xl font-bold mb-2 text-yellow-400">IA 24/7 no Mercado</h3>
          <p className="text-gray-300">Robô próprio, inteligência artificial operando para você, todos os dias e noites.</p>
        </div>
        <div className="bg-[#151b29] bg-opacity-80 rounded-2xl p-8 shadow-xl border border-cyan-800/40 hover:scale-105 hover:shadow-cyan-400/30 transition-all duration-300 flex flex-col items-center text-center">
          {icons.profit}
          <h3 className="text-2xl font-bold mb-2 text-green-400">Só cobra se der lucro</h3>
          <p className="text-gray-300">Zero taxa fixa, só comissão sobre lucro real, nunca no prejuízo.</p>
        </div>
      </section>

      {/* PLANOS - OPÇÃO DIFERENCIAL */}
      <section className="max-w-5xl mx-auto py-8 px-4 grid md:grid-cols-2 gap-7">
        <div className="bg-gradient-to-tr from-cyan-900 via-[#151b29] to-[#181c34] p-7 rounded-2xl shadow-xl border border-cyan-800/40">
          <h4 className="text-lg uppercase font-black text-cyan-300 tracking-wide mb-1">Plano Mensal</h4>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-yellow-400">R$ 120/mês</span>
            <span className="text-gray-300">+ 8% do lucro</span>
          </div>
          <ul className="text-gray-300 text-base ml-5 list-disc">
            <li>Acesso ilimitado e prioridade de suporte</li>
            <li>Pagou, usou, cancelou a hora que quiser</li>
            <li>Só pague comissão se tiver lucro</li>
          </ul>
        </div>
        <div className="bg-gradient-to-tr from-cyan-900 via-[#151b29] to-[#181c34] p-7 rounded-2xl shadow-xl border border-cyan-800/40">
          <h4 className="text-lg uppercase font-black text-cyan-300 tracking-wide mb-1">Plano Pré-pago</h4>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-yellow-400">15% do lucro</span>
            <span className="text-gray-300">saldo mínimo R$ 120</span>
          </div>
          <ul className="text-gray-300 text-base ml-5 list-disc">
            <li>Nenhuma mensalidade fixa</li>
            <li>Ideal para testar sem compromisso</li>
            <li>Mesma proteção e tecnologia do plano mensal</li>
          </ul>
        </div>
      </section>

      {/* VISUALIZAÇÃO EM TEMPO REAL */}
      <section className="bg-gradient-to-r from-[#181c34] via-[#111726] to-[#101323] py-12 my-12 shadow-inner">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-7 text-yellow-400 drop-shadow-lg">
            Lucro em Tempo Real
          </h2>
          <div className="w-full rounded-2xl shadow-2xl border border-cyan-700 bg-[#12192a]/90 text-left p-8 flex flex-col gap-2">
            <p className="font-bold text-cyan-300 mb-1 text-lg">Rentabilidade do dia: <span className="text-green-400">+3.2% / +$52.00</span></p>
            <p className="font-bold text-cyan-300 mb-1 text-lg">Rentabilidade mês: <span className="text-green-400">+12.5% / +$320.00</span></p>
            <p className="text-gray-300">Transparência total e acompanhamento ao vivo direto no painel do assinante.</p>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="max-w-5xl mx-auto py-16 px-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-9 text-cyan-300 text-center">O que dizem nossos assinantes</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-[#161b27] rounded-2xl p-6 shadow-md border border-cyan-900/30">
            <p className="italic text-gray-200">“Finalmente um robô que protege meu saldo e só lucra junto comigo!”</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              <span className="text-xs text-gray-400">Henrique S.</span>
            </div>
          </div>
          <div className="bg-[#161b27] rounded-2xl p-6 shadow-md border border-cyan-900/30">
            <p className="italic text-gray-200">“Tive mais resultado em 1 mês do que 1 ano tentando operar sozinho.”</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              <span className="text-xs text-gray-400">Paula M.</span>
            </div>
          </div>
          <div className="bg-[#161b27] rounded-2xl p-6 shadow-md border border-cyan-900/30">
            <p className="italic text-gray-200">“Prático, seguro e com suporte que responde de verdade.”</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              <span className="text-xs text-gray-400">Leandro T.</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto py-14 px-6">
        <h2 className="text-2xl font-bold mb-8 text-cyan-300 text-center">Perguntas Frequentes</h2>
        <div className="space-y-6">
          <details className="bg-[#161b27] rounded-xl p-5 cursor-pointer border border-cyan-900/30 shadow">
            <summary className="font-semibold text-yellow-400">Preciso transferir dinheiro para CoinbitClub?</summary>
            <p className="text-gray-300 mt-2">Não! Seu saldo nunca sai da sua exchange. Operamos apenas via API autorizada por você.</p>
          </details>
          <details className="bg-[#161b27] rounded-xl p-5 cursor-pointer border border-cyan-900/30 shadow">
            <summary className="font-semibold text-yellow-400">Consigo desligar o robô quando quiser?</summary>
            <p className="text-gray-300 mt-2">Sim. Controle total: pause, ajuste ou desligue em tempo real pela sua área do assinante.</p>
          </details>
          <details className="bg-[#161b27] rounded-xl p-5 cursor-pointer border border-cyan-900/30 shadow">
            <summary className="font-semibold text-yellow-400">Quais os riscos?</summary>
            <p className="text-gray-300 mt-2">Todo investimento em ativos digitais envolve risco. Você tem controle total e o sistema só cobra sobre lucro.</p>
          </details>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-cyan-400 text-black py-14 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para ver o MarketBot em ação?</h2>
        <p className="text-lg mb-8">Teste grátis por 7 dias. Sem compromisso.</p>
        <Link
          to="/cadastro"
          className="bg-black text-cyan-400 px-12 py-5 rounded-full font-black text-2xl hover:bg-gray-900 transition shadow-xl"
        >
          Quero Testar Agora!
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#101323] text-center text-gray-400 py-8 text-xs border-t border-cyan-900/30">
        <div className="flex justify-center items-center gap-4 mb-2">
          <span className="inline-block rounded-full px-3 py-1 bg-cyan-700/30 text-xs text-cyan-300 font-bold">100% Seguro</span>
          <span className="inline-block rounded-full px-3 py-1 bg-yellow-400/20 text-xs text-yellow-400 font-bold">Inteligência Artificial</span>
          <span className="inline-block rounded-full px-3 py-1 bg-green-400/20 text-xs text-green-400 font-bold">Resultados Reais</span>
        </div>
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
