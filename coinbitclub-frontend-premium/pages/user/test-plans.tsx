import React from 'react';
import Head from 'next/head';

export default function TestPlans() {
  return (
    <>
      <Head>
        <title>Planos e Assinatura | CoinBitClub</title>
      </Head>
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-yellow-400 mb-4">⚡ CoinBitClub</h1>
          <h2 className="text-2xl text-blue-400 mb-6">Página de Planos</h2>
          <p className="text-gray-300">✅ Funcionando Corretamente!</p>
          <div className="mt-8">
            <a href="/user/dashboard" className="text-blue-400 hover:text-yellow-400 underline">
              ← Voltar ao Dashboard
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
