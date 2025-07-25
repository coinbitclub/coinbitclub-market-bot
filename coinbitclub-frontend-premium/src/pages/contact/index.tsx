import React from 'react';
import Head from 'next/head';
import { FiMail, FiMessageSquare, FiTwitter } from 'react-icons/fi';

const ContactPage = () => {
  return (
    <>
      <Head>
        <title>Contato - CoinbitClub</title>
      </Head>
      <main className="min-h-screen bg-slate-900 text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              Entre em Contato
            </h1>
            <p className="mt-4 text-lg text-slate-400">Estamos aqui para ajudar. Escolha o melhor canal para você.</p>
          </div>

          <div className="grid gap-8 text-center md:grid-cols-3">
            <div className="premium-card p-8">
              <FiMail className="mx-auto mb-4 size-12 text-emerald-400" />
              <h2 className="mb-2 text-2xl font-bold">Email</h2>
              <p className="mb-4 text-slate-400">Para suporte técnico e questões gerais.</p>
              <a href="mailto:suporte@coinbit.club" className="font-semibold text-emerald-400 hover:text-emerald-300">suporte@coinbit.club</a>
            </div>
            <div className="premium-card p-8">
              <FiMessageSquare className="mx-auto mb-4 size-12 text-emerald-400" />
              <h2 className="mb-2 text-2xl font-bold">Chat</h2>
              <p className="mb-4 text-slate-400">Fale com nossa equipe em tempo real (requer login).</p>
              <button className="font-semibold text-emerald-400 hover:text-emerald-300">Iniciar Chat</button>
            </div>
            <div className="premium-card p-8">
              <FiTwitter className="mx-auto mb-4 size-12 text-emerald-400" />
              <h2 className="mb-2 text-2xl font-bold">Redes Sociais</h2>
              <p className="mb-4 text-slate-400">Nos acompanhe para novidades e anúncios.</p>
              <a href="#" className="font-semibold text-emerald-400 hover:text-emerald-300">@CoinbitClub</a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ContactPage;
