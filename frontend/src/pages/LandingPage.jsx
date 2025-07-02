import React from "react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-dark text-light flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4 text-accent">CoinbitClub MarketBot</h1>
      <h2 className="text-2xl font-semibold mb-4">QUER GANHAR EM DÓLAR E NÃO SABE COMO INVESTIR?</h2>
      <p className="text-lg mb-8 max-w-xl text-center">
        Não tem tempo para seguir o mercado? Deixe a Tecnologia Operar Por Você — Com seu dinheiro sob o seu Controle!
        <br />
        Teste grátis por 7 dias. Saldo sempre seguro na sua exchange.
      </p>
      <a href="/cadastro" className="px-8 py-4 rounded-xl bg-primary text-white font-bold text-xl shadow-lg hover:scale-105 transition">QUERO TESTAR GRÁTIS POR 7 DIAS!</a>
      <div className="mt-12 text-xs text-gray-400">
        CoinbitClub nunca toca no seu saldo!
      </div>
    </main>
  );
}
