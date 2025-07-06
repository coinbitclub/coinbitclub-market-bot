import React from "react";

export default function FAQ() {
  return (
    <div className="p-6 max-w-3xl mx-auto text-white">
      <h2 className="text-3xl font-bold mb-6">Perguntas Frequentes</h2>
      <details className="bg-zinc-800 rounded p-4 mb-2">
        <summary className="font-semibold cursor-pointer">É seguro usar o sistema?</summary>
        <p className="text-sm text-zinc-400 mt-2">Sim. O saldo permanece na sua conta da exchange. O sistema opera com chaves sem permissão de saque.</p>
      </details>
      <details className="bg-zinc-800 rounded p-4 mb-2">
        <summary className="font-semibold cursor-pointer">Quais exchanges são compatíveis?</summary>
        <p className="text-sm text-zinc-400 mt-2">Atualmente Binance e Bybit, incluindo testnet.</p>
      </details>
    </div>
  );
}
