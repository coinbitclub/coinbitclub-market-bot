import React from "react";
import { Link } from "react-router-dom";

function IconShield() {
  return (
    <svg className="w-7 h-7 mx-auto mb-2 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 5.25-3.75 10-7 10S5 17.25 5 12V7l7-4z" />
    </svg>
  );
}
function IconIA() {
  return (
    <svg className="w-7 h-7 mx-auto mb-2 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path strokeWidth="2" d="M12 8v4l3 3" />
      <circle cx="12" cy="7" r="1" fill="#00FFD8" />
    </svg>
  );
}
function IconProfit() {
  return (
    <svg className="w-7 h-7 mx-auto mb-2 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="7" y="9" width="10" height="7" rx="2" strokeWidth="2"/>
      <path d="M12 6v3" strokeWidth="2" />
      <path d="M10 13h4" strokeWidth="2" />
      <circle cx="12" cy="17" r="1.5" fill="#FFC93C" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-gradient-to-br from-[#111727] via-[#171c29] to-[#101323] min-h-screen flex flex-col justify-center items-center font-sans text-white">
      {/* CARD CENTRAL */}
      <div className="w-full max-w-2xl md:max-w-3xl bg-[#10151f]/90 rounded-3xl shadow-2xl border border-[#23283a] p-6 md:p-10 mx-3 my-10 flex flex-col items-center relative" style={{ boxShadow: "0 8px 48px 0 rgba(0,255,255,0.07)" }}>
        
        {/* Header/logo */}
        <div className="w-full flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="CoinbitClub" className="h-9 md:h-10 rounded-full bg-[#182232] p-1" />
            <span className="font-bold text-lg md:text-xl tracking-tight text-cyan-200" style={{letterSpacing: ".5px"}}>CoinbitClub<br className="md:hidden"/><span className="font-medium text-xs md:text-sm block text-gray-400">MarketBot</span></span>
          </div>
          <Link to="/login" className="bg-cyan-400 hover:bg-cyan-300 text-[#222] font-semibold text-xs md:text-base px-4 py-2 rounded-full shadow transition-all">
            Área do Assinante
          </Link>
        </div>

        {/* Hero */}
        <div className="text-center mb-5 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-black mb-2 md:mb-4 leading-tight">
            O robô de cripto que <span className="text-cyan-200">só lucra junto com você</span>
          </h1>
          <p className="text-sm md:text-base text-gray-300 mb-5">
            Teste grátis 7 dias: Saldo sempre seguro na sua exchange.
          </p>
          <Link
            to="/cadastro"
            className="inline-block bg-yellow-400 hover:bg-yellow-300 text-[#101323] font-bold py-3 px-7 rounded-full text-base md:text-lg shadow-lg transition-all mb-2"
            style={{ minWidth: 220 }}
          >
            Quero Testar Grátis
          </Link>
        </div>

        {/* Diferenciais */}
        <div className="w-full flex flex-col md:flex-row gap-3 md:gap-4 mb-7 md:mb-8">
          <div className="flex-1 bg-[#11192a]/70 rounded-xl border border-cyan-900/30 px-3 py-3 md:py-5 text-center shadow flex flex-col items-center min-w-[120px]">
            <IconShield />
            <span className="text-xs md:text-sm font-bold text-cyan-200 mb-0.5">Saldo Sempre Seguro</span>
            <span className="text-xs text-gray-400">Seu dinheiro nunca sai da sua exchange.</span>
          </div>
          <div className="flex-1 bg-[#11192a]/70 rounded-xl border border-cyan-900/30 px-3 py-3 md:py-5 text-center shadow flex flex-col items-center min-w-[120px]">
            <IconIA />
            <span className="text-xs md:text-sm font-bold text-cyan-200 mb-0.5">IA 24/7</span>
            <span className="text-xs text-gray-400">Robô próprio operando todos os dias.</span>
          </div>
          <div className="flex-1 bg-[#11192a]/70 rounded-xl border border-cyan-900/30 px-3 py-3 md:py-5 text-center shadow flex flex-col items-center min-w-[120px]">
            <IconProfit />
            <span className="text-xs md:text-sm font-bold text-yellow-300 mb-0.5">Só cobra no lucro</span>
            <span className="text-xs text-gray-400">Você só paga comissão quando tem lucro.</span>
          </div>
        </div>

        {/* Resultados e Depoimentos */}
        <div className="w-full flex flex-col md:flex-row gap-3 md:gap-4 mb-4">
          <div className="flex-1 flex flex-col justify-center items-center text-left">
            <div className="mb-2">
              <div className="text-xl md:text-2xl font-black text-white leading-tight">
                <span className="text-cyan-200">+3,2%</span>
                <span className="text-base font-medium text-gray-300 ml-1">Rentabilidade diária</span>
              </div>
              <div className="text-xl md:text-2xl font-black text-white leading-tight">
                <span className="text-cyan-200">+12,5%</span>
                <span className="text-base font-medium text-gray-300 ml-1">Rentabilidade mensal</span>
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="bg-[#151e2c]/60 rounded-xl p-3 text-xs text-white font-medium shadow border border-cyan-900/20">
              <span>“O MarketBot fez tudo mais fácil!”</span>
              <div className="text-[10px] text-gray-400 mt-1">Ana M</div>
            </div>
            <div className="bg-[#151e2c]/60 rounded-xl p-3 text-xs text-white font-medium shadow border border-cyan-900/20">
              <span>“Lucro constante e sem complicação”</span>
              <div className="text-[10px] text-gray-400 mt-1">Pedro R</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full text-center text-[11px] text-gray-400 mt-2 pt-2 border-t border-cyan-900/10 flex flex-wrap justify-center gap-2">
          <span>Termos de Uso</span>
          <span>•</span>
          <span>Política de Privacidade</span>
        </div>
      </div>
      {/* Fundo gradiente animado discreto */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 1200 800" className="absolute inset-0 w-full h-full" fill="none">
          <defs>
            <radialGradient id="bg1" cx="60%" cy="10%" r="100%" gradientUnits="userSpaceOnUse">
              <stop stopColor="#01E4F8" stopOpacity="0.10" />
              <stop offset="0.4" stopColor="#181C34" stopOpacity="0.07" />
              <stop offset="1" stopColor="#101323" stopOpacity="0.90" />
            </radialGradient>
            <radialGradient id="bg2" cx="90%" cy="80%" r="90%" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFC93C" stopOpacity="0.10" />
              <stop offset="0.6" stopColor="#0C101B" stopOpacity="0.04" />
              <stop offset="1" stopColor="#101323" stopOpacity="0.7" />
            </radialGradient>
          </defs>
          <rect width="1200" height="800" fill="url(#bg1)" />
          <rect width="1200" height="800" fill="url(#bg2)" />
        </svg>
      </div>
    </div>
  );
}
