import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

const HelpPage = () => {
  return (
    <>
      <Head>
        <title>Central de Ajuda - CoinbitClub</title>
      </Head>
      <main className="min-h-screen bg-slate-900 text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              Central de Ajuda
            </h1>
            <p className="mt-4 text-lg text-slate-400">Como podemos ajudar?</p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none text-slate-300">
            <h2>Perguntas Frequentes (FAQ)</h2>
            <ul>
              <li>Como eu conecto minha conta da Binance?</li>
              <li>Quais são as taxas da plataforma?</li>
              <li>Meus fundos estão seguros?</li>
              <li>Posso cancelar minha assinatura a qualquer momento?</li>
            </ul>

            <h2>Guias e Tutoriais</h2>
            <p>
              Para um aprendizado mais aprofundado, visite nossa seção de <Link href="/docs">Documentação</Link>, onde você encontrará guias completos sobre todos os aspectos da nossa plataforma.
            </p>

            <h2>Suporte Técnico</h2>
            <p>
              Se você não encontrou a resposta para sua pergunta, nossa equipe de suporte está pronta para ajudar. Entre em contato conosco através da nossa página de <Link href="/contact">Contato</Link> e responderemos o mais breve possível.
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default HelpPage;
