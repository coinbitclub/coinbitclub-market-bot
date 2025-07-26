import React from 'react';
import Head from 'next/head';

export default function AccountingPage() {
  return (
    <>
      <Head>
        <title>Contabilidade | CoinBitClub Admin</title>
      </Head>
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-3xl font-bold mb-8">Gestão Financeira</h1>
        <div className="bg-zinc-900 p-6 rounded-lg">
          <p className="text-lg">Módulo de contabilidade em desenvolvimento...</p>
        </div>
      </div>
    </>
  );
}
