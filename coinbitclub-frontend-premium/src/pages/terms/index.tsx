import React from 'react';
import Head from 'next/head';

const TermsPage = () => {
  return (
    <>
      <Head>
        <title>Termos de Uso - CoinbitClub</title>
      </Head>
      <main className="min-h-screen bg-slate-900 text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              Termos de Uso
            </h1>
            <p className="mt-4 text-lg text-slate-400">Última atualização: 19 de Julho de 2025</p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none text-slate-300">
            <p>
              Ao acessar ou usar a plataforma CoinbitClub, você concorda em cumprir e estar vinculado a estes Termos de Uso.
            </p>

            <h2>1. Uso da Plataforma</h2>
            <p>
              Você concorda em usar a plataforma apenas para fins legais e de acordo com estes Termos. Você é responsável por manter a confidencialidade de sua conta e senha.
            </p>

            <h2>2. Riscos de Investimento</h2>
            <p>
              O trading de criptomoedas envolve alto risco e pode não ser adequado para todos os investidores. O CoinbitClub não é um consultor financeiro. As ferramentas e informações fornecidas são para fins educacionais e de automação, e não constituem aconselhamento de investimento.
            </p>

            <h2>3. Limitação de Responsabilidade</h2>
            <p>
              O CoinbitClub não será responsável por quaisquer perdas financeiras incorridas através do uso de nossa plataforma. O desempenho passado não é indicativo de resultados futuros.
            </p>
            
            <h2>4. Modificações nos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos sobre quaisquer alterações publicando os novos termos no site.
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default TermsPage;



