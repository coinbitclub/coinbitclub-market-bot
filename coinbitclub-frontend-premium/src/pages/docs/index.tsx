import React from 'react';
import Head from 'next/head';

const DocsPage = () => {
  return (
    <>
      <Head>
        <title>Documentação - CoinbitClub</title>
      </Head>
      <main className="min-h-screen bg-slate-900 text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              Documentação
            </h1>
            <p className="mt-4 text-lg text-slate-400">Tudo o que você precisa saber para usar a plataforma.</p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none text-slate-300">
            <h2>Primeiros Passos</h2>
            <p>
              Bem-vindo à documentação do CoinbitClub. Aqui você encontrará guias detalhados sobre como configurar sua conta, conectar sua exchange, escolher uma estratégia e ativar seu primeiro robô de trading.
            </p>

            <h2>Conectando sua Exchange</h2>
            <p>
              O primeiro passo é conectar sua conta de uma exchange suportada (Binance, Coinbase, etc.) usando chaves de API. Ensinamos como criar essas chaves com as permissões corretas para garantir a segurança dos seus fundos.
            </p>

            <h2>Estratégias de Trading</h2>
            <p>
              Oferecemos uma variedade de estratégias, desde as mais conservadoras até as mais agressivas. Nesta seção, detalhamos o funcionamento de cada uma, incluindo os indicadores utilizados e o perfil de risco.
            </p>

            <h2>Gerenciamento de Risco</h2>
            <p>
              Aprenda a configurar parâmetros de stop-loss, take-profit e gerenciamento de portfólio para proteger seu capital e otimizar seus retornos.
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default DocsPage;



