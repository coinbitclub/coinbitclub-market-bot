import React from 'react';
import Head from 'next/head';

export default function SettingsPage() {
  return (
    <>
      <Head>
        <title>Configurações | CoinBitClub Admin</title>
      </Head>
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-3xl font-bold mb-8">Configurações do Sistema</h1>
        <div className="bg-zinc-900 p-6 rounded-lg">
          <p className="text-lg">Módulo de configurações em desenvolvimento...</p>
        </div>
      </div>
    </>
  );
}
