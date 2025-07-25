import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function TestSimplePage() {
  return (
    <>
      <Head>
        <title>Página de Teste - CoinbitClub</title>
      </Head>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6 text-emerald-500">Página de Teste</h1>
        <p className="mb-4 text-white">Esta é uma página simples para teste.</p>
        <p className="mb-4 text-white">Se você consegue ver este conteúdo, a página está carregando corretamente.</p>
        
        <div className="mt-8 p-4 border border-emerald-500 rounded-lg inline-block">
          <p className="text-emerald-400">Status: Funcionando ✓</p>
        </div>
        
        <div className="mt-8">
          <Link href="/" className="text-emerald-400 hover:text-emerald-300">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </>
  );
}
